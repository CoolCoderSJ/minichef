import requests, os, json


def main(context):
  context.log(context.req.body)
  response = requests.get(f"https://api.edamam.com/api/recipes/v2?type=public&q={context.req.body}&app_id=57f05ab2&app_key=d3029203d078c7021aad66ce5bdef484").content
  return context.res.send(response)