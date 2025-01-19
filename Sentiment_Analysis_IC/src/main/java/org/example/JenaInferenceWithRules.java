package org.example;

import org.apache.jena.query.*;
import org.apache.jena.rdf.model.*;
import org.apache.jena.reasoner.*;
import org.apache.jena.reasoner.rulesys.GenericRuleReasoner;
import org.apache.jena.reasoner.rulesys.Rule;

import java.io.FileOutputStream;
import java.io.IOException;

public class JenaInferenceWithRules {

    public static void main(String[] args) {
        // Chemin des fichiers
        String ontologyFile = "src/main/resources/ProductOntologie.owl";
        String schemaFile = "src/main/resources/output_schema.ttl";
        String dataFile = "src/main/resources/output_data.ttl";
        String rulesFile = "src/main/resources/rules.txt"; // Fichier de règles

        // Créer un modèle RDF vide
        Model model = ModelFactory.createDefaultModel();
        try {
            model.read(ontologyFile, "RDF/XML"); // Spécifiez le format correct
            model.read(schemaFile, "TTL");
            model.read(dataFile, "TTL");

            // Charger les règles depuis un fichier
            String ruleString = new String(java.nio.file.Files.readAllBytes(java.nio.file.Paths.get(rulesFile)));
            Reasoner reasoner = new GenericRuleReasoner(Rule.parseRules(ruleString));

            // Appliquer les règles au modèle
            InfModel infModel = ModelFactory.createInfModel(reasoner, model);

            // Sauvegarder le modèle inféré dans un fichier
            try (FileOutputStream out = new FileOutputStream("src/main/resources/inferred_model.ttl")) {
                infModel.write(out, "TTL");
            }

            // Affiche le modèle inféré sur la console
            //infModel.write(System.out, "TTL");

            // Exemple de requête SPARQL après inférence
            String queryString = "PREFIX ex: <http://example.org/property/>\n" +
                    "\n" +
                    "# Requête pour extraire des produits et marques basées sur les règles\n" +
                    "SELECT ?product ?trend ?suggestedAction ?brand ?potential WHERE {\n" +
                    "  # Extrait les produits avec une tendance à la hausse de la demande\n" +
                    "  OPTIONAL {\n" +
                    "    ?product ex:hasTrend ex:increasedDemand .\n" +
                    "    ?product ex:suggestedAction ex:promote .\n" +
                    "  }\n" +
                    "  \n" +
                    "  # Identifie les marques avec un potentiel d'augmentation des parts de marché\n" +
                    "  OPTIONAL {\n" +
                    "    ?brand ex:hasPotential ex:marketShareIncrease .\n" +
                    "  }\n" +
                    "}\n" +
                    "LIMIT 10\n";

            // Exécution de la requête
            Query query = QueryFactory.create(queryString);
            try (QueryExecution qexec = QueryExecutionFactory.create(query, infModel)) {
                ResultSet results = qexec.execSelect();

                // Affichage des résultats
                while (results.hasNext()) {
                    QuerySolution soln = results.nextSolution();
                    Resource product = soln.getResource("product");
                    Literal price = soln.getLiteral("price");
                    Literal discount = soln.getLiteral("discount");

                    System.out.println("Product: " + product.getURI() +
                            ", Price: " + price.getString() +
                            ", Discount: " + discount.getString());
                }
            }
        } catch (IOException e) {
            System.err.println("Erreur lors de la lecture des fichiers ou des règles : " + e.getMessage());
        } catch (Exception e) {
            System.err.println("Erreur inattendue : " + e.getMessage());
        }
    }
}
