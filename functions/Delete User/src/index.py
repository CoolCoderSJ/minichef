from appwrite.client import Client
from appwrite.services.users import Users
import os

def main(ctx):
  client = Client()
  client.set_endpoint('https://appwrite.shuchir.dev/v1')
  client.set_project('minichef')
  client.set_key(os.environ['APPWRITE_API_KEY'])

  users = Users(client)
  users.delete(ctx.req.body)
  
  return ctx.res.send("done")