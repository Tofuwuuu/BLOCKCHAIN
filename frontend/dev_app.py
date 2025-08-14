from types import SimpleNamespace
from datetime import datetime
from flask import Flask, render_template, request, redirect, url_for, flash
from config import Config
from forms import (
    LoginForm, RegistrationForm, SupplierForm, PurchaseOrderForm,
    OrderItemForm, ReceivingForm, ReceivedItemForm, InventoryAdjustmentForm,
)


def format_currency(value):
    try:
        return f"₱{float(value):,.2f}"
    except Exception:
        return str(value)


def create_app() -> Flask:
    app = Flask(
        __name__, template_folder="templates", static_folder="static"
    )
    app.config.from_object(Config)

    @app.context_processor
    def inject_globals():
        return {"config": app.config, "now": datetime.utcnow(), "format_currency": format_currency}

    # Routes
    @app.route("/")
    def index():
        return render_template("index.html")

    @app.route("/login", methods=["GET", "POST"])
    def login():
        form = LoginForm()
        if form.validate_on_submit():
            flash("Logged in (demo)", "success")
            return redirect(url_for("dashboard"))
        return render_template("auth/login.html", form=form)

    @app.route("/logout")
    def logout():
        flash("Logged out (demo)", "info")
        return redirect(url_for("login"))

    @app.route("/register", methods=["GET", "POST"])
    def register():
        form = RegistrationForm()
        if form.validate_on_submit():
            flash("User registered (demo)", "success")
            return redirect(url_for("login"))
        return render_template("auth/register.html", form=form)

    @app.route("/dashboard")
    def dashboard():
        recent_orders = [
            SimpleNamespace(id=1, po_number="PO-20250101-001", supplier=SimpleNamespace(name="TechDistributors Inc"), date_created=datetime.utcnow(), status="Draft"),
        ]
        return render_template(
            "dashboard.html",
            pending_orders=1,
            approved_orders=0,
            low_inventory=2,
            recent_orders=recent_orders,
        )

    # Suppliers
    @app.route("/suppliers")
    def supplier_list():
        suppliers = [
            SimpleNamespace(name="TechDistributors Inc", province="Metro Manila", contact_person="Juan D.", phone="09171234567", bir_tin="123-456-789-000", is_active=True)
        ]
        return render_template("suppliers/list.html", suppliers=suppliers)

    @app.route("/suppliers/create", methods=["GET", "POST"])
    def create_supplier():
        form = SupplierForm()
        if form.validate_on_submit():
            flash("Supplier saved (demo)", "success")
            return redirect(url_for("supplier_list"))
        return render_template("suppliers/detail.html", form=form)

    # Orders
    @app.route("/orders")
    def order_list():
        orders = [
            {"id": 1, "po_number": "PO-20250101-001", "supplier": "TechDistributors Inc", "date_created": "2025-01-01", "status": "Draft", "total_amount": 60000.00},
        ]
        return render_template("orders/list.html", orders=orders)

    @app.route("/orders/create", methods=["GET", "POST"])
    def create_order():
        form = PurchaseOrderForm()
        form.supplier_id.choices = [(1, "TechDistributors Inc"), (2, "ABC Supplies")]
        if form.validate_on_submit():
            flash("PO created (demo)", "success")
            return redirect(url_for("order_list"))
        return render_template("orders/create.html", form=form)

    @app.route("/orders/<int:po_id>", methods=["GET", "POST"])
    def order_detail(po_id: int):
        po = SimpleNamespace(
            id=po_id,
            po_number="PO-20250101-001",
            supplier=SimpleNamespace(name="TechDistributors Inc"),
            date_created=datetime.utcnow(),
            delivery_address="Makati City",
            status="Draft",
            total_amount=60000.00,
            items=[
                SimpleNamespace(product=SimpleNamespace(name="Laptop"), quantity=50, unit_price=1200.00)
            ],
        )
        form = OrderItemForm()
        form.product_id.choices = [(1, "Laptop"), (2, "Mouse")]
        if form.validate_on_submit():
            flash("Item added (demo)", "success")
            return redirect(url_for("order_detail", po_id=po_id))
        return render_template("orders/detail.html", po=po, form=form)

    @app.route("/orders/<int:po_id>/approve")
    def approve_order(po_id: int):
        flash(f"PO {po_id} approved (demo)", "success")
        return redirect(url_for("order_detail", po_id=po_id))

    # Inventory
    @app.route("/inventory")
    def inventory_list():
        inventory = [
            {"id": 1, "product": "Laptop", "unit": "pcs", "quantity": 10, "unit_price": 1200.00, "total_value": 12000.00},
        ]
        return render_template("inventory/list.html", inventory=inventory)

    @app.route("/inventory/receive", methods=["GET", "POST"])
    def receive_shipment():
        form = ReceivingForm()
        form.po_id.choices = [(1, "PO-20250101-001")]
        if form.validate_on_submit():
            flash("Receiving report created (demo)", "success")
            return redirect(url_for("receive_items", report_id=1))
        return render_template("inventory/receive.html", form=form)

    @app.route("/inventory/receive/<int:report_id>", methods=["GET", "POST"])
    def receive_items(report_id: int):
        report = SimpleNamespace(
            id=report_id,
            purchase_order=SimpleNamespace(po_number="PO-20250101-001"),
            items=[],
        )
        form = ReceivedItemForm()
        form.product_id.choices = [(1, "Laptop")]
        if form.validate_on_submit():
            flash("Item received (demo)", "success")
            return redirect(url_for("receive_items", report_id=report_id))
        return render_template("inventory/receive_items.html", report=report, form=form)

    @app.route("/inventory/adjust", methods=["GET", "POST"])
    def adjust_inventory():
        form = InventoryAdjustmentForm()
        form.product_id.choices = [(1, "Laptop")]
        if form.validate_on_submit():
            flash("Inventory adjusted (demo)", "success")
            return redirect(url_for("inventory_list"))
        return render_template("inventory/adjust.html", form=form)

    # Reports
    @app.route("/reports/audit")
    def audit_report():
        po_id = request.args.get("po_id")
        transactions = []
        if po_id:
            transactions = [
                {"block_index": 1, "timestamp": str(datetime.utcnow()), "sender": "user:1", "receiver": f"po:{po_id}", "action": "po_create"}
            ]
        return render_template("reports/audit.html", transactions=transactions)

    @app.route("/reports/bir")
    def bir_report():
        report = {
            "company_name": app.config.get("COMPANY_NAME"),
            "company_address": app.config.get("COMPANY_ADDRESS"),
            "bir_tin": app.config.get("BIR_TIN"),
            "report_period": f"{datetime.utcnow().month}/{datetime.utcnow().year}",
            "total_purchases": 0,
            "total_vat": 0,
            "items": [],
        }
        return render_template("reports/bir.html", report=report)

    # Blockchain explorer (demo data)
    @app.route("/blockchain")
    def blockchain_explorer():
        chain = [
            {
                "index": 0,
                "timestamp": str(datetime.utcnow()),
                "hash": "0000abcd",
                "previous_hash": "0",
                "nonce": 0,
                "transactions": [],
            }
        ]
        return render_template("blockchain/explorer.html", chain=chain)

    @app.route("/blockchain/block/<int:index>")
    def view_block(index: int):
        block = {
            "index": index,
            "timestamp": str(datetime.utcnow()),
            "hash": "0000efgh",
            "previous_hash": "0000abcd",
            "nonce": 123,
            "transactions": [],
        }
        return render_template("blockchain/block.html", block=block)

    return app


if __name__ == "__main__":
    app = create_app()
    app.run(host="0.0.0.0", port=5000, debug=True)


