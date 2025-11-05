"""Initialize database tables"""
from app.db.session import engine, Base
from app.models.user import User, Profile
from app.models.item import Item, ItemClaim
from app.models.department import Department
from app.models.event import Event
from app.models.schedule import Schedule
from app.models.feedback import Feedback, FeedbackToken
from app.models.notification import Notification

def init_db():
    """Create all tables"""
    print("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    print("✓ Database tables created successfully!")

if __name__ == "__main__":
    init_db()

