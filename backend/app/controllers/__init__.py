from dataclasses import dataclass

from app.controllers.age_range_controller import AgeRangeController
from app.controllers.galaxy_controller import GalaxyController
from app.controllers.gamification_controller import GamificationController
from app.controllers.health_controller import HealthController
from app.controllers.learning_controller import LearningController
from app.controllers.planetary_system_controller import PlanetarySystemController
from app.controllers.user_controller import UserController


@dataclass(frozen=True)
class Controllers:
    health: HealthController
    age_ranges: AgeRangeController
    galaxies: GalaxyController
    systems: PlanetarySystemController
    learning: LearningController
    gamification: GamificationController
    users: UserController
