from collections.abc import Iterable

from flask import Flask, Response, request

from app.config.settings import Settings, load_settings
from app.controllers import Controllers
from app.controllers.age_range_controller import AgeRangeController
from app.controllers.galaxy_controller import GalaxyController
from app.controllers.gamification_controller import GamificationController
from app.controllers.health_controller import HealthController
from app.controllers.learning_controller import LearningController
from app.controllers.planetary_system_controller import PlanetarySystemController
from app.controllers.user_controller import UserController
from app.errors import register_error_handlers
from app.repositories.age_range_repository import AgeRangeRepository
from app.repositories.data_source import create_data_source
from app.repositories.galaxy_repository import GalaxyRepository
from app.repositories.lab_repository import LabRepository
from app.repositories.lesson_repository import LessonRepository
from app.repositories.planet_repository import PlanetRepository
from app.repositories.planetary_system_repository import PlanetarySystemRepository
from app.routes import register_routes
from app.services.age_range_service import AgeRangeService
from app.services.galaxy_service import GalaxyService
from app.services.gamification_service import GamificationService
from app.services.health_service import HealthService
from app.services.learning_service import LearningService
from app.services.planetary_system_service import PlanetarySystemService
from app.services.user_service import UserService

CORS_METHODS = "GET, POST, PUT, PATCH, DELETE, OPTIONS"
CORS_HEADERS = "Content-Type, Authorization"


def create_app(settings: Settings | None = None) -> Flask:
    settings = settings or load_settings()

    app = Flask(__name__)
    app.json.ensure_ascii = False
    app.json.sort_keys = False

    data_source = create_data_source(settings)
    age_ranges = AgeRangeRepository(data_source)
    galaxies = GalaxyRepository(data_source)
    systems = PlanetarySystemRepository(data_source)
    planets = PlanetRepository(data_source)
    lessons = LessonRepository(data_source)
    labs = LabRepository(data_source)

    controllers = Controllers(
        health=HealthController(HealthService(age_ranges)),
        age_ranges=AgeRangeController(AgeRangeService(age_ranges, galaxies)),
        galaxies=GalaxyController(GalaxyService(galaxies, age_ranges, systems, planets)),
        systems=PlanetarySystemController(PlanetarySystemService(systems, galaxies, planets)),
        learning=LearningController(LearningService(lessons, labs, planets, systems)),
        gamification=GamificationController(GamificationService()),
        users=UserController(UserService()),
    )

    register_error_handlers(app)
    register_cors(app, settings.cors_origins)
    register_routes(app, controllers)
    return app


def register_cors(app: Flask, origins: Iterable[str]) -> None:
    allowed_origins = set(origins)

    @app.before_request
    def answer_preflight() -> Response | None:
        if request.method == "OPTIONS" and request.routing_exception is None:
            return app.response_class(status=204)
        return None

    @app.after_request
    def add_cors_headers(response: Response) -> Response:
        response.vary.add("Origin")
        origin = request.headers.get("Origin")
        if origin in allowed_origins:
            response.headers["Access-Control-Allow-Origin"] = origin
            response.headers["Access-Control-Allow-Methods"] = CORS_METHODS
            response.headers["Access-Control-Allow-Headers"] = CORS_HEADERS
        return response
