import json
import csv

with open('../frontend/src/data/mockData.json', 'r') as f:
    data = json.load(f)

with open ('./invoices.csv', 'w', newline='') as f:
    writer = csv.DictWriter(f, fieldnames=data[0].keys())
    writer.writeheader()
    writer.writerows(data)