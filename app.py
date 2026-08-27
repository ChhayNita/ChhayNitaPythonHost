import os
import json
import hashlib
import secrets
from urllib import request as urllib_request
from urllib.error import URLError

from flask import Flask, flash, make_response, redirect, render_template, request, session, url_for


app = Flask(__name__)

FAKE_STORE_API = "https://fakestoreapi.com"
CART_COOKIE = "cart"
CART_MAX_AGE = 60 * 60 * 24 * 30
USERS_FILE = os.path.join("data", "users.json")


def load_env_file(filename=".env"):
    if not os.path.exists(filename):
        return

    with open(filename, encoding="utf-8") as env_file:
        for line in env_file:
            line = line.strip()

            if not line or line.startswith("#") or "=" not in line:
                continue

            key, value = line.split("=", 1)
            key = key.strip()
            value = value.strip().strip('"').strip("'")
            os.environ.setdefault(key, value)


load_env_file()
app.secret_key = os.environ.get("SECRET_KEY", "dev-secret-key")
app.config["TEMPLATES_AUTO_RELOAD"] = True
app.config["SEND_FILE_MAX_AGE_DEFAULT"] = 0


def api_get(path):
    api_request = urllib_request.Request(
        f"{FAKE_STORE_API}{path}",
        headers={"User-Agent": "Mozilla/5.0 SV7-Store-Flask"},
    )
    with urllib_request.urlopen(api_request, timeout=10) as response:
        return json.loads(response.read().decode("utf-8"))


def get_products():
    try:
        return api_get("/products")
    except (URLError, TimeoutError, json.JSONDecodeError):
        return []


def get_product(product_id):
    try:
        return decorate_product(api_get(f"/products/{product_id}"))
    except (URLError, TimeoutError, json.JSONDecodeError):
        return None


def decorate_product(product):
    if not product:
        return product

    product = dict(product)
    discounted_price = float(product["price"])
    product["discounted_price"] = discounted_price
    product["original_price"] = round(discounted_price * 1.15, 2)
    product["has_discount"] = product["original_price"] > product["discounted_price"]
    return product


def decorate_products(products):
    return [decorate_product(product) for product in products]


def load_users():
    if not os.path.exists(USERS_FILE):
        return {}

    with open(USERS_FILE, encoding="utf-8") as users_file:
        try:
            return json.load(users_file)
        except json.JSONDecodeError:
            return {}


def save_users(users):
    os.makedirs(os.path.dirname(USERS_FILE), exist_ok=True)
    with open(USERS_FILE, "w", encoding="utf-8") as users_file:
        json.dump(users, users_file, indent=2)


def hash_password(password, salt=None):
    salt = salt or secrets.token_hex(16)
    digest = hashlib.sha256(f"{salt}{password}".encode("utf-8")).hexdigest()
    return f"{salt}${digest}"


def check_password(password, stored_password):
    try:
        salt, digest = stored_password.split("$", 1)
    except ValueError:
        return False

    return hash_password(password, salt) == f"{salt}${digest}"


def get_cart():
    raw_cart = request.cookies.get(CART_COOKIE, "{}")

    try:
        cart = json.loads(raw_cart)
    except json.JSONDecodeError:
        return {}

    clean_cart = {}
    for product_id, quantity in cart.items():
        try:
            quantity = int(quantity)
        except (TypeError, ValueError):
            continue

        if quantity > 0:
            clean_cart[str(product_id)] = quantity

    return clean_cart


def redirect_with_cart(location, cart):
    response = make_response(redirect(location))
    if cart:
        response.set_cookie(
            CART_COOKIE,
            json.dumps(cart, separators=(",", ":")),
            max_age=CART_MAX_AGE,
            samesite="Lax",
        )
    else:
        response.delete_cookie(CART_COOKIE)
    return response


def cart_count():
    return sum(get_cart().values())


def build_cart_items():
    items = []
    total = 0

    for product_id, quantity in get_cart().items():
        product = get_product(product_id)
        if not product:
            continue

        subtotal = float(product["discounted_price"]) * int(quantity)
        total += subtotal
        items.append({"product": product, "quantity": int(quantity), "subtotal": subtotal})

    return items, total


@app.context_processor
def inject_globals():
    current_user = None
    user_email = session.get("user_email")

    if user_email:
        current_user = load_users().get(user_email)

    return {"cart_count": cart_count(), "current_user": current_user}


@app.route("/")
def home():
    products = decorate_products(get_products())
    return render_template("front/index.html", products=products)


@app.route("/products")
def products():
    category = request.args.get("category")
    all_products = decorate_products(get_products())
    products_list = all_products

    if category:
        products_list = [p for p in products_list if p.get("category") == category]

    categories = sorted({p.get("category") for p in all_products if p.get("category")})
    return render_template(
        "front/products.html",
        products=products_list,
        categories=categories,
        active_category=category,
    )


@app.route("/view/<int:product_id>")
@app.route("/product/<int:product_id>")
def product(product_id):
    item = get_product(product_id)
    if not item:
        flash("Product not found. Please try again.")
        return redirect(url_for("products"))

    related = decorate_products([
        p
        for p in get_products()
        if p.get("category") == item.get("category") and p.get("id") != item.get("id")
    ][:4])

    return render_template("front/product.html", product=item, related=related)


@app.route("/cart")
def cart():
    items, total = build_cart_items()
    return render_template("front/cart.html", items=items, total=total)


@app.post("/cart/add/<int:product_id>")
def add_to_cart(product_id):
    cart = get_cart()
    key = str(product_id)
    cart[key] = cart.get(key, 0) + 1
    flash("Product added to cart.")
    return redirect_with_cart(request.referrer or url_for("cart"), cart)


@app.post("/cart/update/<int:product_id>")
def update_cart(product_id):
    action = request.form.get("action")
    cart = get_cart()
    key = str(product_id)

    if key not in cart:
        return redirect(url_for("cart"))

    if action == "plus":
        cart[key] += 1
    elif action == "minus":
        cart[key] -= 1
        if cart[key] <= 0:
            cart.pop(key, None)
    elif action == "remove":
        cart.pop(key, None)

    return redirect_with_cart(url_for("cart"), cart)


@app.post("/cart/clear")
def clear_cart():
    flash("Cart cleared.")
    return redirect_with_cart(url_for("cart"), {})


@app.route("/checkout", methods=["GET", "POST"])
def checkout():
    items, total = build_cart_items()

    if request.method == "POST":
        name = request.form.get("name", "").strip()
        phone = request.form.get("phone", "").strip()
        email = request.form.get("email", "").strip()
        address = request.form.get("address", "").strip()
        notes = request.form.get("notes", "").strip()

        if not items:
            flash("Your cart is empty.")
            return redirect(url_for("cart"))

        send_checkout_notification(name, phone, email, address, notes, items, total)
        flash("Order submitted successfully.")
        return redirect_with_cart(url_for("home"), {})

    return render_template("front/checkout.html", items=items, total=total)


def send_checkout_notification(name, phone, email, address, notes, items, total):
    bot_token = os.environ.get("TELEGRAM_BOT_TOKEN")
    chat_id = os.environ.get("TELEGRAM_CHAT_ID")

    if not has_telegram_config(bot_token, chat_id):
        app.logger.info("Telegram notification skipped because credentials are missing.")
        return

    lines = [
        "New checkout order",
        f"Name: {name}",
        f"Phone: {phone}",
        f"Email: {email}",
        f"Address: {address}",
        f"Notes: {notes or '-'}",
        "",
        "Items:",
    ]

    for item in items:
        product = item["product"]
        lines.append(
            f"- {product['title']} x {item['quantity']} = ${item['subtotal']:.2f}"
        )

    lines.append(f"Total: ${total:.2f}")

    try:
        payload = json.dumps({"chat_id": chat_id, "text": "\n".join(lines)}).encode(
            "utf-8"
        )
        telegram_request = urllib_request.Request(
            f"https://api.telegram.org/bot{bot_token}/sendMessage",
            data=payload,
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        urllib_request.urlopen(telegram_request, timeout=10).read()
    except (URLError, TimeoutError) as exc:
        app.logger.warning("Telegram notification failed: %s", exc)


def has_telegram_config(bot_token, chat_id):
    missing_values = {"", "YOUR_BOT_TOKEN_HERE", "YOUR_GROUP_CHAT_ID_HERE"}
    return (bot_token or "") not in missing_values and (chat_id or "") not in missing_values


@app.route("/account")
def account():
    return render_template("front/account.html")


@app.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        email = request.form.get("email", "").strip().lower()
        password = request.form.get("password", "")
        user = load_users().get(email)

        if not user or not check_password(password, user.get("password", "")):
            flash("Invalid email or password.")
            return redirect(url_for("login"))

        session["user_email"] = email
        flash("Logged in successfully.")
        return redirect(url_for("account"))

    return render_template("front/login.html")


@app.route("/register", methods=["GET", "POST"])
def register():
    if request.method == "POST":
        name = request.form.get("name", "").strip()
        email = request.form.get("email", "").strip().lower()
        password = request.form.get("password", "")
        confirm_password = request.form.get("confirm_password", "")
        users = load_users()

        if email in users:
            flash("This email is already registered.")
            return redirect(url_for("register"))

        if password != confirm_password:
            flash("Passwords do not match.")
            return redirect(url_for("register"))

        if len(password) < 6:
            flash("Password must be at least 6 characters.")
            return redirect(url_for("register"))

        users[email] = {
            "name": name,
            "email": email,
            "password": hash_password(password),
        }
        save_users(users)
        session["user_email"] = email
        flash("Account created successfully.")
        return redirect(url_for("account"))

    return render_template("front/create-user.html")


@app.post("/logout")
def logout():
    session.pop("user_email", None)
    flash("Logged out successfully.")
    return redirect(url_for("home"))


@app.route("/reset-password", methods=["GET", "POST"])
def reset_password():
    if request.method == "POST":
        flash("Password reset link sent.")
        return redirect(url_for("login"))
    return render_template("front/forgot-password.html")


@app.route("/contact")
def contact():
    return render_template("front/share/contact.html")


# Admin Panel

@app.route("/admin")
@app.route("/admin/dashboard")
def admin_dashboard():
    return render_template("admin/dashboard/index.html", active_page="dashboard")

@app.route("/admin/products")
def admin_products():
    return render_template("admin/product/index.html", active_page="product")

@app.route("/admin/users")
def admin_users():
    return render_template("admin/user/index.html", active_page="user")


if __name__ == "__main__":
    app.run(debug=True, port=5000)



