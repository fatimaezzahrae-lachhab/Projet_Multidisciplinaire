import json
from kafka import KafkaConsumer
import pandas as pd
import torch
from torchtext.data.utils import get_tokenizer
from torchtext.vocab import build_vocab_from_iterator
import torch.nn as nn
from cassandra.cluster import Cluster
from cassandra.query import SimpleStatement
from uuid import uuid4
from datetime import datetime
import logging

# Configuration du logger
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")

# Classe RNN (inchangée)
class RNN(nn.Module):
    def __init__(self, vocab_size, embedding_dim, hidden_dim, output_dim, n_layers, bidirectional, dropout):
        super().__init__()
        self.embedding = nn.Embedding(vocab_size, embedding_dim)
        self.rnn = nn.LSTM(embedding_dim, hidden_dim, num_layers=n_layers,
                           bidirectional=bidirectional, dropout=dropout)
        self.fc = nn.Linear(hidden_dim * 2 if bidirectional else hidden_dim, output_dim)
        self.dropout = nn.Dropout(dropout)

    def forward(self, text):
        text = text.long()
        embedded = self.dropout(self.embedding(text))
        packed_embedded = nn.utils.rnn.pack_padded_sequence(
            embedded, lengths=[len(t) for t in text], batch_first=True, enforce_sorted=False
        )
        packed_output, (hidden, cell) = self.rnn(packed_embedded)
        hidden = self.dropout(torch.cat((hidden[-2, :, :], hidden[-1, :, :]), dim=1)) if self.rnn.bidirectional else hidden[-1, :, :]
        return self.fc(hidden)

# Chargement du vocabulaire
def build_vocab_from_df(df, tokenizer):
    tokenizer_gen = (tokenizer(text) for text in df['text'])
    vocab = build_vocab_from_iterator(tokenizer_gen, specials=["<unk>"])
    vocab.set_default_index(vocab["<unk>"])
    return vocab

vocab = build_vocab_from_df(pd.read_csv('dataset/cleaned_dataset.csv'), get_tokenizer('spacy', language='en_core_web_sm'))

# Chargement du modèle
model = RNN(vocab_size=len(vocab), embedding_dim=100, hidden_dim=256, output_dim=1, n_layers=3, bidirectional=True, dropout=0.5)
model.load_state_dict(torch.load('src/best_model.pt'))
model.eval()
model = model.to(torch.device('cuda' if torch.cuda.is_available() else 'cpu'))

# Fonction de prédiction
def predict_sentiment(text, model, vocab, tokenizer):
    tokens = tokenizer(text)
    indexed = torch.tensor([vocab[token] for token in tokens], dtype=torch.long)
    indexed = indexed.unsqueeze(0).to(torch.device('cuda' if torch.cuda.is_available() else 'cpu'))
    with torch.no_grad():
        prediction = model(indexed)
        prediction = torch.sigmoid(prediction).squeeze(0).cpu().numpy()
    return prediction

# Initialisation Cassandra
cluster = Cluster(['localhost'])  # Adresse du serveur Cassandra
session = cluster.connect()
session.set_keyspace('sentiment_analysis')

# Préparation de la requête d'insertion
insert_query = """
    INSERT INTO reviews (brandName, price, rating, text, username, platform, country, prediction)
    VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
"""

# Fonction pour insérer dans Cassandra avec gestion des erreurs
def write_to_cassandra(data):
    try:
        session.execute(SimpleStatement(insert_query), (
            data.get('brandName', None),
            float(data.get('price', 0.0)),
            int(data.get('rating', 0)),
            data.get('text', ""),
            data.get('username', ""),
            data.get('platform', ""),
            data.get('country', ""),
            data.get('prediction', "neutral")
        ))
        logging.info(f"Données insérées dans Cassandra : {data}")
    except Exception as e:
        logging.error(f"Erreur lors de l'insertion dans Cassandra : {e}")

# Initialisation du Consumer Kafka
consumer = KafkaConsumer(
    'model',
    bootstrap_servers='localhost:9092',
    value_deserializer=lambda m: json.loads(m.decode('utf-8')),
    auto_offset_reset='earliest',
    consumer_timeout_ms=5000
)

# Consommation des messages Kafka
logging.info("Démarrage de la consommation des messages Kafka...")

for message in consumer:
    data = message.value
    text = data.get('text', '')

    # Vérification des données
    if not text:
        logging.warning("Le texte est vide, message ignoré.")
        continue

    try:
        # Prédiction du sentiment
        sentiment_score = predict_sentiment(text, model, vocab, get_tokenizer('spacy', language='en_core_web_sm'))
        sentiment_label = 'positive' if sentiment_score > 0.5 else 'negative'

        # Ajouter les résultats aux données
        data['prediction'] = sentiment_label

        # Écriture dans Cassandra
        write_to_cassandra(data)

    except Exception as e:
        logging.error(f"Erreur lors du traitement du message : {e}")

logging.info("Fin de la consommation des messages Kafka.")
