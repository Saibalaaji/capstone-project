from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, VolunteerRating, Volunteer, AssistanceRequest, User

bp = Blueprint("ratings", __name__, url_prefix="/api/ratings")

@bp.route("", methods=["POST"])
@jwt_required()
def submit_rating():
    data = request.json
    
    # Validation
    required = ["volunteerId", "requestId", "rating"]
    for val in required:
        if val not in data:
            return jsonify({"error": f"Missing required field: {val}"}), 400
            
    volunteer_id = data["volunteerId"]
    request_id = data["requestId"]
    rating_val = float(data["rating"])
    comment = data.get("comment", "")
    user_id = int(get_jwt_identity())
    
    # Basic bounds check
    if rating_val < 1.0 or rating_val > 5.0:
        return jsonify({"error": "Rating must be between 1.0 and 5.0"}), 400
        
    volunteer = Volunteer.query.get_or_404(volunteer_id)
    assist_req = AssistanceRequest.query.get_or_404(request_id)
    
    # Avoid duplicate ratings for the same request
    existing = VolunteerRating.query.filter_by(
        user_id=user_id, 
        volunteer_id=volunteer_id, 
        request_id=request_id
    ).first()
    
    if existing:
        return jsonify({"error": "You have already rated this volunteer for this request."}), 400

    # FIX BUG-11: Calculate average BEFORE adding the new rating to the session.
    # Previously db.session.add(new_rating) was called first, which could cause SQLAlchemy's
    # identity map to include the new record in subsequent queries, double-counting it.
    all_existing_ratings = VolunteerRating.query.filter_by(volunteer_id=volunteer_id).all()
    total_count = len(all_existing_ratings) + 1  # +1 for the new rating being added
    total_sum = sum(r.rating for r in all_existing_ratings) + rating_val
    avg_rating = total_sum / total_count

    volunteer.rating = round(avg_rating, 2)
    volunteer.reliability_score = round(min(avg_rating, 5.0), 2)

    # Create the new rating object AFTER computing averages (avoids identity-map double-count)
    new_rating = VolunteerRating(
        user_id=user_id,
        volunteer_id=volunteer_id,
        request_id=request_id,
        rating=rating_val,
        comment=comment
    )
    db.session.add(new_rating)
    db.session.commit()

    return jsonify({
        "message": "Rating submitted successfully",
        "rating": new_rating.to_dict(),
        "newVolunteerAvg": volunteer.rating
    }), 201

@bp.route("/volunteer/<int:volunteer_id>", methods=["GET"])
@jwt_required()
def get_volunteer_ratings(volunteer_id):
    # Verify volunteer exists
    Volunteer.query.get_or_404(volunteer_id)
    
    ratings_query = VolunteerRating.query.filter_by(volunteer_id=volunteer_id).order_by(VolunteerRating.timestamp.desc()).all()
    
    results = []
    for r in ratings_query:
        user = User.query.get(r.user_id)
        d = r.to_dict()
        d["userName"] = user.name if user else "Unknown User"
        results.append(d)
        
    return jsonify(results), 200
