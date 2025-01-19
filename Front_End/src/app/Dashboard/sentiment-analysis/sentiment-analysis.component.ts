import { Component, OnInit } from '@angular/core';
import { ChartData, ChartOptions } from 'chart.js'; // Pour l'utilisation des graphiques
import { SentimentAnalysisService } from '../../Service/sentiment-analysis.service'; // Service d'analyse des sentiments
import { CommonModule } from '@angular/common'; // Module commun requis pour les directives comme ngIf, ngFor
import { NgChartsModule } from 'ng2-charts';

@Component({
  selector: 'app-visualization-dashboard',
  standalone: true,  // Déclaration du composant comme autonome
  imports: [CommonModule, NgChartsModule],  // Importation du module CommonModule nécessaire pour les directives de structure
  templateUrl: './sentiment-analysis.component.html',
  styleUrls: ['./sentiment-analysis.component.css']
})
export class SentimentAnalysisComponent implements OnInit {
  totalProducts: number = 0;
  averagePrice: number = 0;
  mostUsedPlatform: string = '';
  sentimentData: { sentiment: string, count: number }[] = [];
  productCountByBrand: { brand: string, productCount: number }[] = [];
  productsWithLowRatings: { brandname: string, sampleProduct: string, sampleSuggestedAction: string }[] = [];
  marketShareByBrand: { brand: string, productCount: number }[] = [];
  trendByCountryAndBrand: { brand: string, country: string, trendCount: number }[] = [];
  productCountByCountry: { country: string, productCount: number }[] = [];
  productCountByPlatformAndBrand: { brand: string, platform: string, productCount: number }[] = [];
  productDetailsByPlatform: { product: string, platform: string, price: number, user: string }[] = [];

  constructor(private sentimentAnalysisService: SentimentAnalysisService) {}

  ngOnInit(): void {
    // Charger toutes les données au démarrage
    this.loadTotalProducts();
    this.loadAveragePrice();
    this.loadMostUsedPlatform();
    this.loadSentimentAnalysis();
    this.loadProductCountByBrand();
    this.loadProductsWithLowRatings();
    this.loadMarketShareByBrand();
    this.loadTrendByCountryAndBrand();
    this.loadProductCountByCountry();
    this.loadProductCountByPlatformAndBrand();
    this.loadProductDetailsByPlatform();
  }

  // Chargement des données
  loadTotalProducts(): void {
    this.sentimentAnalysisService.getTotalProducts().subscribe(data => {
      this.totalProducts = data;
      console.log(this.totalProducts);
    });
  }

  loadAveragePrice(): void {
    this.sentimentAnalysisService.getAveragePrice().subscribe(data => {
      this.averagePrice = data;
      console.log(this.averagePrice);
    });
  }

  loadMostUsedPlatform(): void {
    this.sentimentAnalysisService.getMostUsedPlatform().subscribe(data => {
      this.mostUsedPlatform = data.platform;
      console.log(this.mostUsedPlatform);
    });
  }

  loadSentimentAnalysis(): void {
    this.sentimentAnalysisService.getSentimentAnalysis().subscribe(data => {
      this.sentimentData = data;
      console.log(this.sentimentData);
      this.updateCharts(); // Mettre à jour les graphiques après avoir récupéré les données
    });
  }

  loadProductCountByBrand(): void {
    this.sentimentAnalysisService.getProductCountByBrand().subscribe(data => {
      this.productCountByBrand = data;
      console.log(this.productCountByBrand);
      this.updateCharts(); // Mettre à jour les graphiques après avoir récupéré les données
    });
  }

  loadProductsWithLowRatings(): void {
    this.sentimentAnalysisService.getProductsWithLowRatings().subscribe(data => {
      this.productsWithLowRatings = Array.isArray(data) ? data : [data];
      console.log(this.productsWithLowRatings);
    });
  }

  loadMarketShareByBrand(): void {
    this.sentimentAnalysisService.getMarketShareByBrand().subscribe(data => {
      this.marketShareByBrand = data;
      console.log(this.marketShareByBrand);
      this.updateCharts(); // Mettre à jour les graphiques après avoir récupéré les données
    });
  }

  loadTrendByCountryAndBrand(): void {
    this.sentimentAnalysisService.getTrendByCountryAndBrand().subscribe(data => {
      this.trendByCountryAndBrand = data;
      console.log(this.trendByCountryAndBrand);
      this.updateCharts(); // Mettre à jour les graphiques après avoir récupéré les données
    });
  }

  loadProductCountByCountry(): void {
    this.sentimentAnalysisService.getProductCountByCountry().subscribe(data => {
      this.productCountByCountry = data;
      this.updateCharts(); // Mettre à jour les graphiques après avoir récupéré les données
    });
  }

  loadProductCountByPlatformAndBrand(): void {
    this.sentimentAnalysisService.getProductCountByPlatformAndBrand().subscribe(data => {
      this.productCountByPlatformAndBrand = data;
      this.updateCharts(); // Mettre à jour les graphiques après avoir récupéré les données
    });
  }

  loadProductDetailsByPlatform(): void {
    this.sentimentAnalysisService.getProductDetailsByPlatform().subscribe(data => {
      this.productDetailsByPlatform = data;
    });
  }

  // Mise à jour des données pour les graphiques après récupération des données
  updateCharts(): void {
    // Mise à jour des données du graphique linéaire
    this.lineChartData = {
      labels: this.productCountByBrand.map(b => b.brand),
      datasets: [{
        data: this.productCountByBrand.map(b => b.productCount),
        label: 'Nombre de produits par marque',
        fill: false,
        borderColor: '#5995d1 ', 
        tension: 0.1
      }]
    };

    // Mise à jour des données pour le graphique donut (sentiment)
    this.donutChartData = {
      labels: this.sentimentData.map(s => s.sentiment),
      datasets: [{
        data: this.sentimentData.map(s => s.count),
        backgroundColor: [ ' #ec7063' ,'#0c539b'], // Nuances de violet
      }]
    };

    // Mise à jour des données pour le graphique Market Share
    this.marketShareChartData = {
      labels: this.marketShareByBrand.map(m => m.brand),
      datasets: [{
        data: this.marketShareByBrand.map(m => m.productCount),
        backgroundColor: ['#bfc9ca', '#c0392b ', '#7b1fa2'], // Variations de violet
      }]
    };

    // Mise à jour des données pour le graphique Trend by Country and Brand
    this.trendChartData = {
      labels: this.trendByCountryAndBrand.map(t => `${t.country} - ${t.brand}`),
      datasets: [{
        data: this.trendByCountryAndBrand.map(t => t.trendCount),
        label: 'Tendance par pays et marque',
        fill: false,
        borderColor: '#9b59b6', 
        tension: 0.1
      }]
    };

    // Mise à jour des données pour le graphique Product Count by Country
    this.countryProductChartData = {
      labels: this.productCountByCountry.map(p => p.country),
      datasets: [{
        data: this.productCountByCountry.map(p => p.productCount),
        label: 'Nombre de produits par pays',
        backgroundColor: '#abebc6 ', 
      }]
    };

    // Mise à jour des données pour le graphique Product Count by Platform and Brand
    this.platformBrandChartData = {
      labels: this.productCountByPlatformAndBrand.map(p => `${p.platform} - ${p.brand}`),
      datasets: [{
        data: this.productCountByPlatformAndBrand.map(p => p.productCount),
        label: 'Nombre de produits par plateforme et marque',
        backgroundColor: '#7e57c2', // Violet foncé
      }]
    };
  }

  // Données pour le graphique linéaire (exemple)
  public lineChartData: ChartData<'line'> = {
    labels: [], // Les labels seront remplis après récupération des données
    datasets: [{
      data: [],
      label: 'Nombre de produits par marque',
      fill: false,
      borderColor: '#9b59b6', // Violet clair
      tension: 0.1
    }]
  };

  public lineChartOptions: ChartOptions<'line'> = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
    },
  };

  // Données pour le donut
  public donutChartData: ChartData<'doughnut'> = {
    labels: [],
    datasets: [{
      data: [],
      backgroundColor: ['#6a1b9a', '#9c27b0'], // Nuances de violet
    }]
  };

  public donutChartOptions: ChartOptions<'doughnut'> = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
    },
  };

  // Données pour le graphique Market Share
  public marketShareChartData: ChartData<'doughnut'> = {
    labels: [],
    datasets: [{
      data: [],
      backgroundColor: ['#8e24aa', '#9b59b6', '#7b1fa2'], // Variations de violet
    }]
  };

  public marketShareChartOptions: ChartOptions<'doughnut'> = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
    },
  };

  // Données pour le graphique Trend by Country and Brand
  public trendChartData: ChartData<'line'> = {
    labels: [],
    datasets: [{
      data: [],
      label: 'Tendance par pays et marque',
      fill: false,
      borderColor: '#9b59b6', // Violet clair
      tension: 0.1
    }]
  };

  public trendChartOptions: ChartOptions<'line'> = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
    },
  };

  // Données pour le graphique Product Count by Country
  public countryProductChartData: ChartData<'bar'> = {
    labels: [],
    datasets: [{
      data: [],
      label: 'Nombre de produits par pays',
      backgroundColor: '#ab47bc', // Violet moyen
    }]
  };

  public countryProductChartOptions: ChartOptions<'bar'> = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
    },
  };

  // Données pour le graphique Product Count by Platform and Brand
  public platformBrandChartData: ChartData<'bar'> = {
    labels: [],
    datasets: [{
      data: [],
      label: 'Nombre de produits par plateforme et marque',
      backgroundColor: '#7e57c2', // Violet foncé
    }]
  };

  public platformBrandChartOptions: ChartOptions<'bar'> = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
    },
  };
}
