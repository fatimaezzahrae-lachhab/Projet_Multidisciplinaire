from kafka import KafkaConsumer
import json
import pandas as pd
import csv
import random
import re

# Fonction de prétraitement de la colonne texte
def preprocess_text(text):
    if pd.isnull(text) or len(text) < 3:  # Gérer les valeurs manquantes et les textes très courts
        return None
    text = re.sub(r'[^\w\s#@]', '', text)  # Supprimer les caractères non alphanumériques sauf # et @
    text = re.sub(r'http\S+|www.\S+', '', text)  # Supprimer les URLs
    text = re.sub(r'@\w+', '', text)  # Supprimer les mentions Twitter
    text = re.sub(r'#\w+', '', text)  # Supprimer les hashtags
    text = text.lower()  # Convertir en minuscules
    return text.strip() if len(text.strip()) >= 3 else None  # Supprimer les espaces inutiles

# Fonction pour générer un nom d'utilisateur aléatoire
def generate_username():
    prefixes =  [
        'lily', 'silver', 'smile', 'blue', 'sunny', 'forest', 'flower',
        'galaxy', 'dream', 'shadow', 'gold', 'magic', 'crystal',
        'fire', 'water', 'earth', 'wind', 'sky', 'starlight', 'ember'
    ]
    suffixes =  [
        'joy', 'wave', 'green', 'stone', 'silver', 'galaxy', 'flower',
        'sky', 'cloud', 'dream', 'fox', 'wolf', 'spark', 'heart',
        'shadow', 'moon', 'star', 'light', 'dancer', 'song', 'charm'
    ]
    return f"{random.choice(prefixes)}{random.choice(suffixes)}{random.randint(1000, 9999)}"

# Fonction pour générer une plateforme aléatoire
def generate_platform():
    platforms = ['Instagram', 'Facebook', 'Twitter']
    return random.choice(platforms)

# Fonction pour générer un pays aléatoire
def generate_country():
    countries = ['USA', 'Canada', 'UK', 'France', 'Germany', 'India', 'China', 'Brazil', 'Australia', 'Mexico',
                 'Italy', 'Spain', 'Japan', 'Russia', 'South Korea', 'Netherlands', 'Sweden', 'Norway', 'Switzerland', 'Turkey']
    return random.choice(countries)

# Étape 1 : Tester la consommation Kafka
print("Étape 1 : Consommation Kafka...")
try:
    consumer = KafkaConsumer(
        'sentiment',
        bootstrap_servers=['localhost:9092'],  # Remplacez localhost par l'adresse IP de votre serveur Kafka si nécessaire
        value_deserializer=lambda x: json.loads(x.decode('utf-8')),
        auto_offset_reset='earliest',  # Consommer depuis le début si aucun message n'a été consommé
        consumer_timeout_ms=5000  # Délai d'attente de 5 secondes
    )
    
    data = []
    for message in consumer:
        data.append(message.value)
        if len(data) >= 100000:  # Limitez à 100000 messages pour tester
            break

    print(f"Nombre de messages consommés : {len(data)}")
    if data:
        print(f"Exemple de message : {data[0]}")
    else:
        print("Aucun message consommé. Vérifiez votre configuration Kafka.")
except Exception as e:
    print(f"Erreur lors de la consommation Kafka : {e}")
    exit()

# Étape 2 : Traitement des données sans Spark
print("\nÉtape 2 : Traitement des données...")

# Traitement des données
processed_data = []
for item in data:
    # Prétraitement du texte de la revue
    if 'Reviews' in item:
        item['text'] = preprocess_text(item['Reviews'])
        del item['Reviews']  # Supprimer la colonne 'Reviews' après le prétraitement
    
    # Ajouter des colonnes supplémentaires
    item['username'] = generate_username()
    item['platform'] = generate_platform()
    item['country'] = generate_country()
    
    # Créer un dictionnaire avec les colonnes souhaitées
    processed_item = {
        'brandName': item.get('Brand Name'),
        'price': item.get('Price'),
        'rating': item.get('Rating'),
        'text': item.get('text'),
        'username': item.get('username'),
        'platform': item.get('platform'),
        'country': item.get('country')
    }
    
    processed_data.append(processed_item)

print(f"Nombre de données traitées : {len(processed_data)}")

# Étape 3 : Sauvegarde dans un fichier CSV
print("\nÉtape 3 : Sauvegarde dans un fichier CSV...")
try:
    output_path = "output/test_output.csv"
    
    # Définir les colonnes que vous souhaitez sauvegarder
    fieldnames = ['brandName', 'price', 'rating', 'text', 'username', 'platform', 'country']
    
    # Écrire les données traitées dans un fichier CSV
    with open(output_path, mode='w', newline='', encoding='utf-8') as file:
        writer = csv.DictWriter(file, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(processed_data)
    
    print(f"Les résultats ont été sauvegardés dans {output_path}.")
except Exception as e:
    print(f"Erreur lors de la sauvegarde dans le fichier CSV : {e}")
    exit()

print("\nProcessus terminé avec succès !")
