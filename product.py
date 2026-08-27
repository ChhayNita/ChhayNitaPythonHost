import json
from urllib import request as urllib_request


FAKE_STORE_API = "https://fakestoreapi.com"


def all_products():
    api_request = urllib_request.Request(
        f"{FAKE_STORE_API}/products",
        headers={"User-Agent": "Mozilla/5.0 SV7-Store-Flask"},
    )
    with urllib_request.urlopen(api_request, timeout=10) as response:
        return json.loads(response.read().decode("utf-8"))


def one_product(product_id):
    api_request = urllib_request.Request(
        f"{FAKE_STORE_API}/products/{product_id}",
        headers={"User-Agent": "Mozilla/5.0 SV7-Store-Flask"},
    )
    with urllib_request.urlopen(
        api_request, timeout=10
    ) as response:
        return json.loads(response.read().decode("utf-8"))
