from kafka import KafkaProducer
import pandas as pd
import json
import time

# Charger le dataset
dataset_path = 'dataset/input_test.csv'  # Remplacez par le chemin de votre dataset
df = pd.read_csv(dataset_path)

# Supprimer les lignes où 'Brand Name' contient des valeurs nulles
df = df.dropna(subset=['Brand Name'])

# Filtrer les données
apple_df = df[df['Brand Name'].str.contains('Apple', case=False)].head(50000)
samsung_df = df[df['Brand Name'].str.contains('Samsung', case=False)].head(50000)

# Combiner les deux datasets
filtered_df = pd.concat([apple_df, samsung_df])

# Kafka Producer
producer = KafkaProducer(
    bootstrap_servers=['localhost:9092'],
    value_serializer=lambda v: json.dumps(v).encode('utf-8')
)

# Publier les données dans Kafka avec un délai d'une seconde entre chaque envoi
topic_name = 'sentiment'
for _, row in filtered_df.iterrows():
    producer.send(topic_name, row.to_dict())

print("Les données ont été publiées dans le topic Kafka.")
producer.flush()
producer.close()
