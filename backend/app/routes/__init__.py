from flask import Blueprint, Flask

from app.controllers import Controllers


def register_routes(app: Flask, controllers: Controllers) -> None:
    api = Blueprint("api", __name__, url_prefix="/api")
    health = controllers.health
    age_ranges = controllers.age_ranges
    galaxies = controllers.galaxies
    systems = controllers.systems
    learning = controllers.learning
    gamification = controllers.gamification
    users = controllers.users

    routes = [
        ("/health", "health", health.show, "GET"),
        ("/age-ranges", "age_ranges", age_ranges.index, "GET"),
        ("/age-ranges/<ref>", "age_range", age_ranges.show, "GET"),
        ("/galaxies", "galaxies", galaxies.index, "GET"),
        ("/galaxies/<ref>", "galaxy", galaxies.show, "GET"),
        ("/systems", "systems", systems.index, "GET"),
        ("/systems/<ref>", "system", systems.show, "GET"),
        ("/lessons", "lessons", learning.list_lessons, "GET"),
        ("/lessons/<ref>", "lesson", learning.get_lesson, "GET"),
        ("/labs", "labs", learning.list_labs, "GET"),
        ("/labs/<ref>", "lab", learning.get_lab, "GET"),
        ("/progress", "progress", gamification.list_progress, "GET"),
        ("/progress/<planet_id>", "progress_update", gamification.update_progress, "PUT"),
        ("/scores", "scores", gamification.list_scores, "GET"),
        ("/scores", "score_submit", gamification.submit_score, "POST"),
        ("/achievements", "achievements", gamification.list_achievements, "GET"),
        ("/achievements/me", "my_achievements", gamification.list_my_achievements, "GET"),
        ("/achievements/me", "achievement_unlock", gamification.unlock_achievement, "POST"),
        ("/rankings/galaxies/<ref>", "galaxy_ranking", gamification.galaxy_ranking, "GET"),
        ("/rankings/systems/<ref>", "system_ranking", gamification.system_ranking, "GET"),
        ("/users/me", "current_user", users.me, "GET"),
        ("/users", "user_create", users.create, "POST"),
        ("/users/me", "current_user_update", users.update_me, "PATCH"),
        ("/sessions", "session_create", users.login, "POST"),
        ("/sessions/me", "session_delete", users.logout, "DELETE"),
    ]
    for rule, endpoint, view, method in routes:
        api.add_url_rule(rule, endpoint, view, methods=[method])

    app.register_blueprint(api)
