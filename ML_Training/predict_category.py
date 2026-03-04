import pickle

model = pickle.load(open("transaction_classifier.pkl","rb"))
vectorizer = pickle.load(open("tfidf_vectorizer.pkl","rb"))

def predict(description):

    text_vec = vectorizer.transform([description])

    prediction = model.predict(text_vec)[0]

    confidence = max(model.predict_proba(text_vec)[0])

    return prediction, confidence


if __name__ == "__main__":

    desc = input("Enter transaction description: ")

    category, conf = predict(desc)

    print("Predicted Category:", category)
    print("Confidence:", conf)