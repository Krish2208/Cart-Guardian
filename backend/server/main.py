from typing import Union
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from models import pageData
from ETL import ETLPipeline
from Review import Reviews
import requests

llm_server_url = 'https://7a09-34-143-192-19.ngrok-free.app/'
vlm_server_url = 'https://fc74-34-75-15-111.ngrok-free.app/'

app = FastAPI()
origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def llm_request(promptType: str, promptText: str):
    request_json = {
        "promptType": promptType,
        "promptText": promptText
    }
    response = requests.post(llm_server_url, json=request_json)
    return response.json()

def vlm_request(promptType: str, promptText: str, promptImageURL: str):
    request_json = {
        "promptType": promptType,
        "promptText": promptText,
        "promptImageURL": promptImageURL
    }
    response = requests.post(vlm_server_url, json=request_json)
    return response.json()

def match_product_image():
    image_description = vlm_request('describe', '', app.data.get_product_images()[0]).get('output')
    image_title = app.data.get_product_name()
    output = llm_request('match', f'image description : {image_description} image_title: {image_title}').get('output')
    return output

@app.get("/")
def read_root():
    return {"Hello": "World"}

app.data = None
@app.post("/page")
def create_page(page: pageData.PageData):
    # print(page.pageData)
    app.data = ETLPipeline(page.pageData, page.pageUrl)
    # print(app.data.soup.text.strip().replace('\n', ''))
    print(app.data.get_product_name())
    print(app.data.get_product_images())
    # print('Product Name: ', data.get_product_name())
    # print('Saving: ', data.get_saving())
    # print('Discounted Price: ', data.get_discounted_price())
    # print('MRP: ', data.get_mrp())
    # print('Return Policy: ', data.get_return_policy())
    # print('Free Delivery: ', data.get_free_delivery())
    # print('Product Details: ', data.get_product_details())
    # print('Product Description: ', data.get_product_description())
    # print('Stars: ', data.get_stars())
    # print('Total Reviews: ', data.get_total_reviews())
    # print('Image URL: ', data.get_product_images())
    # print('Reviews', data.get_reviews())
    return {"message": "Data received"}

@app.get("/reviews")
def get_reviews():
    search = Reviews()
    return search.get_reviews(app.data.get_product_name())

@app.get("/match")
def match_product():
    res = match_product_image()
    if res is None:
        return True
    if 'true' in res.lower():
        return True
    elif 'false' in res.lower():
        return False
    else:
        return True