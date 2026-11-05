from fastapi import APIRouter, HTTPException, status
from models import RegisterRequest, LoginRequest, AuthResponse, User
from database import execute_query, execute_modify
from auth import hash_password, verify_password, create_access_token

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=AuthResponse)
def register(req: RegisterRequest):
    # Check if email exists
    existing = execute_query(
        "SELECT ResearcherID FROM Researchers WHERE Email = %s",
        (req.email.strip().lower(),),
        fetch_one=True
    )
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="An account with this email already exists.")

    hashed = hash_password(req.password)
    user_id = execute_modify(
        """
        INSERT INTO Researchers (Name, Email, PasswordHash, Affiliation, ResearchArea, Role)
        VALUES (%s, %s, %s, %s, %s, %s)
        """,
        (req.name.strip(), req.email.strip().lower(), hashed, req.affiliation, req.researchArea, req.role)
    )

    user = User(
        id=user_id,
        name=req.name.strip(),
        email=req.email.strip().lower(),
        affiliation=req.affiliation,
        researchArea=req.researchArea,
        role=req.role
    )

    token = create_access_token({"sub": user.email, "user_id": user.id, "role": user.role})
    return AuthResponse(access_token=token, user=user)

@router.post("/login", response_model=AuthResponse)
def login(req: LoginRequest):
    user_row = execute_query(
        "SELECT * FROM Researchers WHERE Email = %s",
        (req.email.strip().lower(),),
        fetch_one=True
    )
    if not user_row or not verify_password(req.password, user_row["PasswordHash"]):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password.")

    user = User(
        id=user_row["ResearcherID"],
        name=user_row["Name"],
        email=user_row["Email"],
        affiliation=user_row.get("Affiliation") or "",
        researchArea=user_row.get("ResearchArea") or "",
        role=user_row["Role"],
        joinedDate=str(user_row.get("JoinedDate") or "")
    )

    token = create_access_token({"sub": user.email, "user_id": user.id, "role": user.role})
    return AuthResponse(access_token=token, user=user)
