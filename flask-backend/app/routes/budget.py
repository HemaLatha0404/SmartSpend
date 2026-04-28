from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..models import db, Budget, Expense
from datetime import datetime, date
from sqlalchemy import func

budget_bp = Blueprint('budget', __name__)

@budget_bp.route('/', methods=['GET'])
@jwt_required()
def get_budget():
    user_id = int(get_jwt_identity())
    today = datetime.utcnow().date()
    month = request.args.get('month', today.month, type=int)
    year = request.args.get('year', today.year, type=int)

    budget = Budget.query.filter_by(user_id=user_id, month=month, year=year).first()
    if not budget:
        return jsonify({'amount': 0, 'spent': 0, 'remaining': 0, 'percentage': 0}), 200

    start_date = date(year, month, 1)
    if month == 12:
        end_date = date(year+1, 1, 1)
    else:
        end_date = date(year, month+1, 1)

    spent = db.session.query(func.sum(Expense.amount))\
        .filter(Expense.user_id == user_id,
                Expense.date >= start_date,
                Expense.date < end_date).scalar() or 0

    return jsonify({
        'amount': float(budget.amount),
        'spent': float(spent),
        'remaining': float(budget.amount) - float(spent),
        'percentage': (float(spent) / float(budget.amount) * 100) if budget.amount else 0
    }), 200

@budget_bp.route('/', methods=['POST'])
@jwt_required()
def set_budget():
    user_id = int(get_jwt_identity())
    data = request.get_json()
    month = data.get('month')
    year = data.get('year')
    amount = data.get('amount')

    if not month or not year or amount is None:
        return jsonify({'error': 'Month, year, and amount are required'}), 400

    try:
        amount = float(amount)
    except:
        return jsonify({'error': 'Invalid amount'}), 400

    budget = Budget.query.filter_by(user_id=user_id, month=month, year=year).first()
    if budget:
        budget.amount = amount
    else:
        budget = Budget(user_id=user_id, month=month, year=year, amount=amount)
        db.session.add(budget)

    db.session.commit()
    return jsonify(budget.to_dict()), 200

@budget_bp.route('/status', methods=['GET'])
@jwt_required()
def budget_status():
    user_id = int(get_jwt_identity())
    today = datetime.utcnow().date()
    month = today.month
    year = today.year

    budget = Budget.query.filter_by(user_id=user_id, month=month, year=year).first()
    if not budget:
        return jsonify({
            'has_budget': False,
            'amount': 0,
            'spent': 0,
            'percentage': 0,
            'warning': False
        }), 200

    start_date = date(year, month, 1)
    if month == 12:
        end_date = date(year+1, 1, 1)
    else:
        end_date = date(year, month+1, 1)

    spent = db.session.query(func.sum(Expense.amount))\
        .filter(Expense.user_id == user_id,
                Expense.date >= start_date,
                Expense.date < end_date).scalar() or 0

    percentage = (spent / budget.amount * 100) if budget.amount else 0
    warning = percentage >= 80

    return jsonify({
        'has_budget': True,
        'amount': float(budget.amount),
        'spent': float(spent),
        'percentage': float(percentage),
        'warning': warning
    }), 200