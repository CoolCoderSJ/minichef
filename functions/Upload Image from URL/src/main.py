from appwrite.client import Client
from appwrite.input_file import InputFile
from appwrite.services.storage import Storage
import os, json, requests

def main(context):
    client = (
        Client()
        .set_endpoint("https://appwrite.shuchir.dev/v1")
        .set_project("minichef")
        .set_key(os.environ["APPWRITE_API_KEY"])
    )
    storage = Storage(client)

    body = json.loads(context.req.body)
    userId = body['userId']
    context.log(body)

    file = storage.create_file("images", "unique()", InputFile.from_bytes(requests.get(body['url']).content, filename = "cover.jpg"), permissions=[
        f'read("user:{userId}")', 
        f'write("user:{userId}")'
    ])

    return context.res.send(file['$id'])