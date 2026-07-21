from fastapi import FastAPI, Depends
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from pydantic import BaseModel
from database import SessionLocal, Appointment
from datetime import datetime, timedelta
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def generate_time_slots(start="09:00", end="19:00", interval_minutes=30):
    slots = []
    current = datetime.strptime(start, "%H:%M")
    end_time = datetime.strptime(end, "%H:%M")
    while current < end_time:
        slots.append(current.strftime("%H:%M"))
        current += timedelta(minutes=interval_minutes)
    return slots


# ---------- 1. BOOK APPOINTMENT ----------
class BookingRequest(BaseModel):
    patient_name: str
    phone_number: str
    date: str
    time: str
    service: str

@app.post("/api/book-appointment")
def book_appointment(req: BookingRequest, db: Session = Depends(get_db)):
    new_appt = Appointment(**req.dict())
    db.add(new_appt)
    db.commit()
    db.refresh(new_appt)
    return {
        "message": f"Appointment booked for {req.patient_name} on {req.date} at {req.time} for {req.service}.",
        "appointment_id": new_appt.id
    }


# ---------- 2. CHECK AVAILABILITY ----------
class AvailabilityRequest(BaseModel):
    date: str
    time: str = None

@app.post("/api/check-availability")
def check_availability(req: AvailabilityRequest, db: Session = Depends(get_db)):
    booked = db.query(Appointment).filter(Appointment.date == req.date).all()
    all_slots = generate_time_slots("09:00", "19:00", 30)
    booked_times = [a.time for a in booked]
    available = [t for t in all_slots if t not in booked_times]

    if req.time:
        is_available = req.time in available
        return {
            "date": req.date,
            "requested_time": req.time,
            "is_available": is_available,
            "available_slots": available
        }

    return {"date": req.date, "available_slots": available}


# ---------- 3. CONFIRM APPOINTMENT ----------
class ConfirmRequest(BaseModel):
    patient_name: str
    phone_number: str

@app.post("/api/confirm-appointment")
def confirm_appointment(req: ConfirmRequest, db: Session = Depends(get_db)):
    appt = db.query(Appointment).filter(
        Appointment.patient_name == req.patient_name,
        Appointment.phone_number == req.phone_number
    ).first()
    if appt:
        return {"message": f"Yes, {appt.patient_name}, your appointment is confirmed for {appt.date} at {appt.time} for {appt.service}."}
    return {"message": "I couldn't find an appointment with those details. Could you double-check your name and number?"}


# ---------- 4. CANCEL APPOINTMENT ----------
class CancelRequest(BaseModel):
    patient_name: str
    phone_number: str
    date: str
    time: str = None

@app.post("/api/cancel-appointment")
def cancel_appointment(req: CancelRequest, db: Session = Depends(get_db)):
    matches = db.query(Appointment).filter(
        Appointment.phone_number == req.phone_number,
        Appointment.date == req.date
    ).all()
    
    if len(matches) == 0:
        return {"message": "I couldn't find an appointment with that phone number on that date. Could you double-check the date or phone number?"}
    
    if len(matches) == 1:
        appt = matches[0]
        db.delete(appt)
        db.commit()
        return {"message": f"Your {appt.service} appointment on {req.date} at {appt.time} has been cancelled successfully."}
    
    if req.time:
        exact_match = next((a for a in matches if a.time == req.time), None)
        if exact_match:
            db.delete(exact_match)
            db.commit()
            return {"message": f"Your {exact_match.service} appointment on {req.date} at {exact_match.time} has been cancelled successfully."}
    
    times_list = ", ".join([f"{a.time} ({a.service})" for a in matches])
    return {"message": f"I found multiple appointments on that date: {times_list}. Could you specify which time you'd like to cancel?"}
#----

class EscalateRequest(BaseModel):
    phone_number: str
    reason: str
    urgency: str

@app.post("/api/escalate")
def escalate_to_human(req: EscalateRequest):
    print(f"ESCALATION: {req.phone_number} - {req.reason} - {req.urgency}")
    return {"message": "Your request has been escalated. Someone will call you back shortly."}


# ---------- 6. ALL APPOINTMENTS (for dashboard) ----------
@app.get("/api/all-appointments")
def get_all_appointments(db: Session = Depends(get_db)):
    appointments = db.query(Appointment).all()
    return [
        {"id": a.id, "patient_name": a.patient_name, "phone_number": a.phone_number,
         "date": a.date, "time": a.time, "service": a.service, "created_at": a.created_at}
        for a in appointments
    ]
@app.delete("/api/reset-database")
def reset_database():
    from database import Base, engine
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    return {"message": "Database reset with new schema."}

app.mount("/admin", StaticFiles(directory="static/admin", html=True), name="admin-dashboard")
# ---------- STATIC FILES MOUNT (must be LAST) ----------
app.mount("/", StaticFiles(directory="static", html=True), name="static")


