from flask_wtf import FlaskForm
from wtforms import StringField, PasswordField, SelectField, TextAreaField, IntegerField, FloatField, BooleanField
from wtforms.validators import DataRequired, Email, Length, EqualTo, NumberRange
from config import Config


class LoginForm(FlaskForm):
    username = StringField('Username', validators=[DataRequired()])
    password = PasswordField('Password', validators=[DataRequired()])
    remember = BooleanField('Remember Me')


class RegistrationForm(FlaskForm):
    username = StringField('Username', validators=[DataRequired(), Length(min=4, max=80)])
    password = PasswordField('Password', validators=[DataRequired(), Length(min=6)])
    confirm_password = PasswordField('Confirm Password', validators=[DataRequired(), EqualTo('password')])
    full_name = StringField('Full Name', validators=[DataRequired()])
    position = StringField('Position', validators=[DataRequired()])
    department = StringField('Department', validators=[DataRequired()])
    is_admin = BooleanField('Administrator')


class SupplierForm(FlaskForm):
    name = StringField('Supplier Name', validators=[DataRequired()])
    address = StringField('Address', validators=[DataRequired()])
    province = SelectField('Province', choices=[(p, p) for p in Config.PROVINCES])
    contact_person = StringField('Contact Person', validators=[DataRequired()])
    phone = StringField('Phone', validators=[DataRequired()])
    email = StringField('Email', validators=[Email()])
    bir_tin = StringField('BIR TIN', validators=[DataRequired(), Length(min=9, max=15)])
    is_active = BooleanField('Active', default=True)


class PurchaseOrderForm(FlaskForm):
    supplier_id = SelectField('Supplier', coerce=int, validators=[DataRequired()])
    delivery_address = StringField('Delivery Address', validators=[DataRequired()])
    notes = TextAreaField('Notes')


class OrderItemForm(FlaskForm):
    product_id = SelectField('Product', coerce=int, validators=[DataRequired()])
    quantity = IntegerField('Quantity', validators=[DataRequired(), NumberRange(min=1)])
    unit_price = FloatField('Unit Price', validators=[DataRequired(), NumberRange(min=0.01)])


class ReceivingForm(FlaskForm):
    po_id = SelectField('Purchase Order', coerce=int, validators=[DataRequired()])
    notes = TextAreaField('Notes')


class ReceivedItemForm(FlaskForm):
    product_id = SelectField('Product', coerce=int, validators=[DataRequired()])
    quantity = IntegerField('Quantity Received', validators=[DataRequired(), NumberRange(min=1)])
    condition = SelectField('Condition', choices=[('Good', 'Good'), ('Damaged', 'Damaged'), ('Expired', 'Expired')])


class InventoryAdjustmentForm(FlaskForm):
    product_id = SelectField('Product', coerce=int, validators=[DataRequired()])
    adjustment = IntegerField('Adjustment Quantity', validators=[DataRequired()])
    reason = TextAreaField('Reason', validators=[DataRequired()])


