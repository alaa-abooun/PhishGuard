from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from flask_mail import Mail
from config import config

db = SQLAlchemy()
jwt = JWTManager()
mail = Mail()


def create_app(config_name="default"):
    app = Flask(__name__)
    app.config.from_object(config[config_name])

    db.init_app(app)
    jwt.init_app(app)
    mail.init_app(app)
    CORS(app, resources={r"/api/*": {"origins": app.config["CORS_ORIGINS"]}},
         supports_credentials=True)

    from app.routes.auth import auth_bp
    from app.routes.campaigns import campaigns_bp
    from app.routes.ai_generator import ai_bp
    from app.routes.tracking import tracking_bp
    from app.routes.analytics import analytics_bp
    from app.routes.users import users_bp
    from app.routes.gamification import gamification_bp
    from app.routes.reports import reports_bp

    app.register_blueprint(auth_bp,        url_prefix="/api/auth")
    app.register_blueprint(campaigns_bp,   url_prefix="/api/campaigns")
    app.register_blueprint(ai_bp,          url_prefix="/api/ai")
    app.register_blueprint(tracking_bp,    url_prefix="/api/track")
    app.register_blueprint(analytics_bp,   url_prefix="/api/analytics")
    app.register_blueprint(users_bp,       url_prefix="/api/users")
    app.register_blueprint(gamification_bp,url_prefix="/api/gamification")
    app.register_blueprint(reports_bp,     url_prefix="/api/reports")

    return app
