import cohere, os, json


def main(context):
  co = cohere.Client(api_key=os.environ['API_KEY'])
  context.log(context.req.body)
  request = json.loads(context.req.body)
  response = co.chat(
    message=f"""extract the ingredients and instructions for a recipe from this webpage: {request['url']}
list the output as a dictionary. The dictionary should have four keys: name, servings, ingredients and steps. The name key should be the name of the ingredient found from the page. The servings key should be a numerical value that represents the servings this recipe makes. The ingredients key should equal a list of dictionaries, where each dictionary has the following keys: amount, unit, name. The steps key should be a list. Convert all fractional amounts to decimals in the "amount" field before returning. Make sure the output is valid JSON- the keys should be in double quotes, and the values should be in double quotes if they are strings.""",
    model="command-r-plus",
    connectors=[{"id":"web-search"}]
  )

  context.log(response.text.replace("```json", "").replace("```", ""))

  data = json.loads(response.text.replace("```json", "").replace("```", ""))

  from appwrite.client import Client
  from appwrite.services.databases import Databases

  client = (
      Client()
      .set_endpoint("https://appwrite.shuchir.dev/v1")
      .set_project("minichef")
      .set_key(os.environ["APPWRITE_API_KEY"])
  )
  db = Databases(client)

  ing = [item['name'] for item in data['ingredients']]
  amt = [item['amount'] for item in data['ingredients']]
  unit = [item['unit'] for item in data['ingredients']]
  steps = data['steps']

  context.log(request)
  userId = request['userId']
  context.log(userId)
  db.create_document("data", "recipes", "unique()", {
    "uid": request['userId'], 
    "name": data['name'],
    "servings": data['servings'],
    "ingredients": ing,
    "serving_amt": amt,
    "serving_units": unit,
    "steps": steps
  },
  [f'read("user:{userId}")', f'write("user:{userId}")'])

  return context.res.send("done")