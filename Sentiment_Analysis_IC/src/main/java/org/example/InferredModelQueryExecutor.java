package org.example;

import org.apache.jena.query.*;
import org.apache.jena.rdf.model.*;
import org.apache.jena.util.FileManager;

public class InferredModelQueryExecutor {

    private Model inferredModel;

    // Constructeur pour charger directement le modèle inféré
    public InferredModelQueryExecutor(String inferredModelFilePath) {
        try {
            // Charger le modèle RDF inféré depuis un fichier
            inferredModel = FileManager.get().loadModel(inferredModelFilePath);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    // Méthode pour exécuter une requête SPARQL sur le modèle inféré
    public void executeQuery(String sparqlQuery) {
        try {
            // Préparer la requête SPARQL
            Query query = QueryFactory.create(sparqlQuery);

            // Exécuter la requête
            try (QueryExecution queryExecution = QueryExecutionFactory.create(query, inferredModel)) {
                ResultSet results = queryExecution.execSelect();

                // Afficher les résultats dans la console
                ResultSetFormatter.out(System.out, results, query);
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    // Méthode principale pour tester
    public static void main(String[] args) {
        // Chemin vers le fichier RDF inféré
        String inferredModelFilePath = "inferred_model.ttl";

        // Instance de la classe
        InferredModelQueryExecutor executor = new InferredModelQueryExecutor(inferredModelFilePath);

        // Exemple de requête SPARQL
        String sparqlQuery =
                "PREFIX ex: <http://example.org/property/> " +
                        "SELECT ?product ?trend ?country WHERE { " +
                        "  ?product ex:hasTrend ex:increasedDemand ;" +
                        "ex:hasTrend ?trend ;" +
                        "ex:country ?country " +
                        "} LIMIT 5";

        // Exécuter la requête
        executor.executeQuery(sparqlQuery);
    }
}
