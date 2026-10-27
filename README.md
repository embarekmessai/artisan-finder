## To test the API

````
curl -X POST http://localhost:3000/api/search \
  -H "Content-Type: application/json" \
  -d '{
    "city": "Paris",
    "category": "plombier",
    "limit": 200
  }'
````