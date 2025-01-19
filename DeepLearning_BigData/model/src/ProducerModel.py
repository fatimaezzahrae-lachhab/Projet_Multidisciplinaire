from kafka import KafkaProducer
import pandas as pd
import json

# Initialisation du Kafka producer
producer = KafkaProducer(bootstrap_servers='localhost:9092', value_serializer=lambda v: json.dumps(v).encode('utf-8'))

# Charger le dataset
df = pd.read_csv('output/test_output.csv')

# Fonction pour envoyer chaque ligne au topic Kafka
def send_to_kafka(row):
    data = {
        'brandName': row['brandName'],
        'price': row['price'],
        'rating': row['rating'],
        'text': row['text'],
        'username': row['username'],
        'platform': row['platform'],
        'country': row['country']
    }
    producer.send('model', value=data)

# Envoyer toutes les lignes du DataFrame au topic Kafka
for _, row in df.iterrows():
    send_to_kafka(row)

print("Les données ont été publiées dans le topic Kafka.")
producer.flush()
producer.close()
