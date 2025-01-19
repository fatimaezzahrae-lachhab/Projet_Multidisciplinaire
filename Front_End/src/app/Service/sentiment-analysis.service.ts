import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class SentimentAnalysisService {
  private endpoint = 'http://localhost:3030/Base_Inference/query';

  constructor(private http: HttpClient) {}

  // Méthode générique pour exécuter une requête SPARQL
  queryData(sparqlQuery: string): Observable<any> {
    console.log("Executing SPARQL query:", sparqlQuery);
    const headers = new HttpHeaders({ 'Content-Type': 'application/sparql-query' });

    return this.http.post(this.endpoint, sparqlQuery, {
      headers,
      responseType: 'json',  // S'assurer que la réponse est au format JSON
    });
  }

  // 1. Nombre total de produits
  getTotalProducts(): Observable<number> {
    const query = `
      PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
      SELECT (COUNT(?product) AS ?totalProducts)
      WHERE {
        ?product rdf:type <http://example.org/Product> .
      }
    `;
    return this.queryData(query).pipe(
      map((response: any) => {
        if (response.results && response.results.bindings && response.results.bindings.length > 0) {
          const totalProductsValue = response.results.bindings[0].totalProducts.value;
          return parseInt(totalProductsValue, 10);
        } else {
          console.error('No totalProducts found in the response.');
          return 0;
        }
      })
    );
  }

  // 2. Répartition des produits par marque
  getProductCountByBrand(): Observable<{ brand: string, productCount: number }[]> {
    const query = `
      PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
      PREFIX ns1: <http://example.org/property/>
      SELECT ?brand (COUNT(?product) AS ?productCount)
      WHERE {
        ?product rdf:type <http://example.org/Product> ;
                 ns1:brandname ?brand .
      }
      GROUP BY ?brand
      ORDER BY DESC(?productCount)
    `;
    return this.queryData(query).pipe(
      map((response: any) => {
        return response.results.bindings.map((binding: any) => ({
          // Convertir la marque en format uniforme pour éviter des doublons (par exemple, "Samsung" et "samsung" sont différents)
          brand: binding.brand.value.trim(),
          // Convertir le count en nombre (parseInt ou Number)
          productCount: parseInt(binding.productCount.value, 10)
        }));
      })
    );
  }
  

  // 3. Pourcentage des sentiments positifs/négatifs
  getSentimentAnalysis(): Observable<{ sentiment: string, count: number }[]> {
    const query = `
      PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
      PREFIX ns1: <http://example.org/property/>
      SELECT ?sentiment (COUNT(?product) AS ?count)
      WHERE {
        ?product rdf:type <http://example.org/Product> ;
                 ns1:sentiment-category ?sentiment .
      }
      GROUP BY ?sentiment
    `;
    return this.queryData(query).pipe(
      map((response: any) => {
        return response.results.bindings.map((binding: any) => ({
          sentiment: binding.sentiment.value,  // Extraire la valeur du sentiment
          count: Number(binding.count.value)   // Convertir le count en nombre (parseInt ou Number)
        }));
      })
    );
  }
  

  // 4. Prix moyen des produits
  getAveragePrice(): Observable<number> {
    const query = `
      PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
      PREFIX ns1: <http://example.org/property/>
      SELECT (AVG(?price) AS ?averagePrice)
      WHERE {
        ?product rdf:type <http://example.org/Product> ;
                 ns1:price ?price .
      }
    `;
    return this.queryData(query).pipe(
      map((response: any) => {
        return parseFloat(response.results.bindings[0].averagePrice.value);
      })
    );
  }

  // 5. Plateforme la plus utilisée
  getMostUsedPlatform(): Observable<{ platform: string, interactionCount: number }> {
    const query = `
      PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
      PREFIX ns1: <http://example.org/property/>
      SELECT ?platform (COUNT(?interaction) AS ?interactionCount)
      WHERE {
        ?interaction rdf:type <http://example.org/Product> ;
                     ns1:platform ?platform .
      }
      GROUP BY ?platform
      ORDER BY DESC(?interactionCount)
      LIMIT 1
    `;
    return this.queryData(query).pipe(
      map((response: any) => {
        return {
          platform: response.results.bindings[0].platform.value,
          interactionCount: parseInt(response.results.bindings[0].interactionCount.value, 10)
        };
      })
    );
  }

  // 6. Liste des produits avec des notes faibles
  getProductsWithLowRatings(): Observable<{ brandname: string, sampleProduct: string, sampleSuggestedAction: string }> {
    const query = `
      PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
      PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
      PREFIX ns1: <http://example.org/property/>
      SELECT ?brandname (SAMPLE(?product) AS ?sampleProduct) (SAMPLE(?suggestedAction) AS ?sampleSuggestedAction)
      WHERE {
        ?product rdf:type <http://example.org/Product> ;
                 ns1:rating ?rating ;
                 ns1:suggestedAction ?suggestedAction ;
                 ns1:brandname ?brandname .
        FILTER(xsd:integer(?rating) <= 2)
      }
      GROUP BY ?brandname
      LIMIT 10
    `;
    return this.queryData(query).pipe(
      map((response: any) => {
        return response.results.bindings.map((binding: any) => ({
          brandname: binding.brandname.value,
          sampleProduct: binding.sampleProduct ? binding.sampleProduct.value : null,
          sampleSuggestedAction: binding.sampleSuggestedAction ? binding.sampleSuggestedAction.value : null
        }));
      })
    );
  }
  

  // 7. Part de marché des marques (Apple vs Samsung)
  getMarketShareByBrand(): Observable<{ brand: string, productCount: number }[]> {
    const query = `
      PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
      PREFIX ns1: <http://example.org/property/>
      SELECT ?brand (COUNT(?product) AS ?productCount)
      WHERE {
        ?product rdf:type <http://example.org/Product> ;
                 ns1:brandname ?brand .
        FILTER(?brand IN ("Apple", "Samsung"))
      }
      GROUP BY ?brand
      ORDER BY DESC(?productCount)
    `;
    return this.queryData(query).pipe(
      map((response: any) => {
        return response.results.bindings.map((binding: any) => ({
          brand: binding.brand.value,
          productCount: parseInt(binding.productCount.value, 10)
        }));
      })
    );
  }

  // 8. Analyse des tendances par marque et pays
  getTrendByCountryAndBrand(): Observable<{ brand: string, country: string, trendCount: number }[]> {
    const query = `
      PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
      PREFIX ns1: <http://example.org/property/>
      SELECT ?brand ?country ?trend (COUNT(?product) AS ?trendCount)
      WHERE {
        ?product rdf:type <http://example.org/Product> ;
                 ns1:brandname ?brand ;
                 ns1:country ?country ;
                 ns1:hasTrend ?trend .
      }
      GROUP BY ?brand ?country ?trend
      ORDER BY DESC(?trendCount)
      LIMIT 10
    `;
    return this.queryData(query).pipe(
      map((response: any) => {
        return response.results.bindings.map((binding: any) => ({
          brand: binding.brand.value,
          country: binding.country.value,
          trendCount: parseInt(binding.trendCount.value, 10)
        }));
      })
    );
  }

  // 9. Répartition géographique des produits
  getProductCountByCountry(): Observable<{ country: string, productCount: number }[]> {
    const query = `
      PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
      PREFIX ns1: <http://example.org/property/>
      SELECT ?country (COUNT(?product) AS ?productCount)
      WHERE {
        ?product rdf:type <http://example.org/Product> ;
                 ns1:country ?country .
      }
      GROUP BY ?country
      ORDER BY DESC(?productCount)
      LIMIT 10
    `;
    return this.queryData(query).pipe(
      map((response: any) => {
        return response.results.bindings.map((binding: any) => ({
          country: binding.country.value,
          productCount: parseInt(binding.productCount.value, 10)
        }));
      })
    );
  }

  // 10. Répartition des produits par plateforme et marque
  getProductCountByPlatformAndBrand(): Observable<{ brand: string, platform: string, productCount: number }[]> {
    const query = `
      PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
      PREFIX ns1: <http://example.org/property/>
      SELECT ?brand ?platform (COUNT(?product) AS ?productCount)
      WHERE {
        ?product rdf:type <http://example.org/Product> ;
                 ns1:brandname ?brand ;
                 ns1:platform ?platform .
      }
      GROUP BY ?brand ?platform
      ORDER BY ?brand ?platform
    `;
    return this.queryData(query).pipe(
      map((response: any) => {
        return response.results.bindings.map((binding: any) => ({
          brand: binding.brand.value,
          platform: binding.platform.value,
          productCount: parseInt(binding.productCount.value, 10)
        }));
      })
    );
  }

  // 11. Détails des produits par plateforme
  getProductDetailsByPlatform(): Observable<{ product: string, platform: string, price: number, user: string }[]> {
    const query = `
      PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
      PREFIX ns1: <http://example.org/property/>
      PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
      SELECT ?product ?platform ?price ?user
      WHERE {
        ?product rdf:type <http://example.org/Product> ;
                 ns1:platform ?platform ;
                 ns1:price ?price ;
                 ns1:users ?user .
        FILTER(xsd:integer(?price) < 50)
      }
      LIMIT 10
    `;
    return this.queryData(query).pipe(
      map((response: any) => {
        return response.results.bindings.map((binding: any) => ({
          product: binding.product.value,
          platform: binding.platform.value,
          price: parseFloat(binding.price.value),
          user: binding.user.value
        }));
      })
    );
  }
}
