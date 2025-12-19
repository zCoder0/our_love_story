from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Request
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.responses import JSONResponse, RedirectResponse
from typing import Optional, List
import os
import uuid
import shutil
import json
import hashlib
import secrets
from datetime import datetime
from pathlib import Path

app = FastAPI(title="Our Forever - Couple Album")

# Create directories
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)
(UPLOAD_DIR / "images").mkdir(exist_ok=True)
(UPLOAD_DIR / "videos").mkdir(exist_ok=True)

# JSON files for storage
USERS_FILE = Path("users.json")
SESSIONS_FILE = Path("sessions.json")
MEDIA_FILE = Path("media.json")
NOTES_FILE = Path("notes.json")

# Mount static files
app.mount("/static", StaticFiles(directory="static"), name="static")
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Templates
templates = Jinja2Templates(directory="templates")

# Allowed file extensions
ALLOWED_IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".webp"}
ALLOWED_VIDEO_EXTENSIONS = {".mp4", ".webm", ".mov", ".avi", ".mkv"}


# ==================== JSON Helper Functions ====================

def load_json(file_path: Path, default: dict) -> dict:
    """Load data from JSON file"""
    if file_path.exists():
        with open(file_path, 'r') as f:
            return json.load(f)
    return default

def save_json(file_path: Path, data: dict):
    """Save data to JSON file"""
    with open(file_path, 'w') as f:
        json.dump(data, f, indent=2)


# ==================== User Management ====================

def load_users() -> dict:
    return load_json(USERS_FILE, {"users": []})

def save_users(data: dict):
    save_json(USERS_FILE, data)

def load_sessions() -> dict:
    return load_json(SESSIONS_FILE, {"sessions": {}})

def save_sessions(data: dict):
    save_json(SESSIONS_FILE, data)

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def get_user_by_username(username: str) -> Optional[dict]:
    data = load_users()
    for user in data["users"]:
        if user["username"].lower() == username.lower():
            return user
    return None

def create_session(user_id: str) -> str:
    token = secrets.token_hex(32)
    sessions = load_sessions()
    sessions["sessions"][token] = {
        "user_id": user_id,
        "created_at": datetime.now().isoformat()
    }
    save_sessions(sessions)
    return token

def get_session_user(token: str) -> Optional[dict]:
    if not token:
        return None
    sessions = load_sessions()
    session = sessions["sessions"].get(token)
    if session:
        data = load_users()
        for user in data["users"]:
            if user["id"] == session["user_id"]:
                return user
    return None

def delete_session(token: str):
    sessions = load_sessions()
    if token in sessions["sessions"]:
        del sessions["sessions"][token]
        save_sessions(sessions)

def get_current_user(request: Request) -> Optional[dict]:
    token = request.cookies.get("session_token")
    return get_session_user(token)


# ==================== Media Management ====================

def load_media() -> dict:
    return load_json(MEDIA_FILE, {"media": []})

# Timeline file
TIMELINE_FILE = Path("timeline.json")

def load_timeline() -> dict:
    return load_json(TIMELINE_FILE, {"events": []})

def save_timeline(data: dict):
    save_json(TIMELINE_FILE, data)

def save_media(data: dict):
    save_json(MEDIA_FILE, data)

def get_user_media(user_id: str, file_type: str = None, category: str = None) -> List[dict]:
    data = load_media()
    media_list = []
    for item in data["media"]:
        if item.get("user_id") == user_id:
            if file_type and item.get("file_type") != file_type:
                continue
            if category and item.get("category") != category:
                continue
            # Add URL
            if item["file_type"] == "image":
                item["url"] = f"/uploads/images/{item['filename']}"
            else:
                item["url"] = f"/uploads/videos/{item['filename']}"
            media_list.append(item)
    return sorted(media_list, key=lambda x: x.get("created_at", ""), reverse=True)

def get_media_by_id(media_id: str, user_id: str) -> Optional[dict]:
    data = load_media()
    for item in data["media"]:
        if item["id"] == media_id and item.get("user_id") == user_id:
            if item["file_type"] == "image":
                item["url"] = f"/uploads/images/{item['filename']}"
            else:
                item["url"] = f"/uploads/videos/{item['filename']}"
            return item
    return None

def add_media(media_item: dict):
    data = load_media()
    data["media"].append(media_item)
    save_media(data)

def update_media(media_id: str, user_id: str, updates: dict) -> bool:
    data = load_media()
    for item in data["media"]:
        if item["id"] == media_id and item.get("user_id") == user_id:
            item.update(updates)
            save_media(data)
            return True
    return False

def delete_media_item(media_id: str, user_id: str) -> Optional[dict]:
    data = load_media()
    for i, item in enumerate(data["media"]):
        if item["id"] == media_id and item.get("user_id") == user_id:
            deleted = data["media"].pop(i)
            save_media(data)
            return deleted
    return None

def get_file_extension(filename: str) -> str:
    return Path(filename).suffix.lower()

def get_file_type(filename: str) -> str:
    ext = get_file_extension(filename)
    if ext in ALLOWED_IMAGE_EXTENSIONS:
        return "image"
    elif ext in ALLOWED_VIDEO_EXTENSIONS:
        return "video"
    return "unknown"


# ==================== Auth Routes ====================

@app.get("/login")
async def login_page(request: Request):
    user = get_current_user(request)
    if user:
        return RedirectResponse(url="/", status_code=302)
    return templates.TemplateResponse("login.html", {"request": request})

@app.get("/signup")
async def signup_page(request: Request):
    user = get_current_user(request)
    if user:
        return RedirectResponse(url="/", status_code=302)
    return templates.TemplateResponse("signup.html", {"request": request})

@app.post("/api/signup")
async def signup(
    username: str = Form(...),
    email: str = Form(...),
    password: str = Form(...),
    partner1: str = Form(default=""),
    partner2: str = Form(default=""),
    anniversary: str = Form(default="")
):
    if get_user_by_username(username):
        return JSONResponse(
            status_code=400,
            content={"success": False, "message": "Username already exists"}
        )

    data = load_users()
    for user in data["users"]:
        if user["email"].lower() == email.lower():
            return JSONResponse(
                status_code=400,
                content={"success": False, "message": "Email already registered"}
            )

    user_id = str(uuid.uuid4())
    new_user = {
        "id": user_id,
        "username": username,
        "email": email,
        "password": hash_password(password),
        "partner1": partner1,
        "partner2": partner2,
        "anniversary": anniversary,
        "created_at": datetime.now().isoformat()
    }

    data["users"].append(new_user)
    save_users(data)

    return {"success": True, "message": "Account created successfully"}

@app.post("/api/login")
async def login(
    username: str = Form(...),
    password: str = Form(...)
):
    user = get_user_by_username(username)

    if not user or user["password"] != hash_password(password):
        return JSONResponse(
            status_code=401,
            content={"success": False, "message": "Invalid username or password"}
        )

    token = create_session(user["id"])

    response = JSONResponse(content={"success": True, "message": "Login successful"})
    response.set_cookie(
        key="session_token",
        value=token,
        httponly=True,
        max_age=7 * 24 * 60 * 60,
        samesite="lax"
    )

    return response

@app.post("/api/logout")
async def logout(request: Request):
    token = request.cookies.get("session_token")
    if token:
        delete_session(token)

    response = JSONResponse(content={"success": True, "message": "Logged out"})
    response.delete_cookie("session_token")
    return response

@app.get("/api/me")
async def get_me(request: Request):
    user = get_current_user(request)
    if not user:
        return JSONResponse(
            status_code=401,
            content={"success": False, "message": "Not authenticated"}
        )

    return {
        "success": True,
        "user": {
            "id": user["id"],
            "username": user["username"],
            "email": user["email"],
            "partner1": user.get("partner1", ""),
            "partner2": user.get("partner2", ""),
            "anniversary": user.get("anniversary", "")
        }
    }


# ==================== Main Routes ====================

@app.get("/")
async def home(request: Request):
    user = get_current_user(request)
    if not user:
        return RedirectResponse(url="/login", status_code=302)
    return templates.TemplateResponse("index.html", {"request": request, "user": user})


# ==================== Media Routes ====================

@app.post("/api/upload")
async def upload_media(
    request: Request,
    file: UploadFile = File(...),
    category: str = Form(default="dates"),
    caption: str = Form(default=""),
    date_taken: str = Form(default="")
):
    user = get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")

    ext = get_file_extension(file.filename)
    file_type = get_file_type(file.filename)

    if file_type == "unknown":
        raise HTTPException(status_code=400, detail="File type not allowed")

    file_id = str(uuid.uuid4())
    new_filename = f"{file_id}{ext}"

    if file_type == "image":
        save_path = UPLOAD_DIR / "images" / new_filename
    else:
        save_path = UPLOAD_DIR / "videos" / new_filename

    try:
        with open(save_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        file_size = os.path.getsize(save_path)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save file: {str(e)}")
    finally:
        file.file.close()

    media_item = {
        "id": file_id,
        "filename": new_filename,
        "original_name": file.filename,
        "file_type": file_type,
        "category": category,
        "caption": caption,
        "date_taken": date_taken or datetime.now().strftime("%Y-%m-%d"),
        "created_at": datetime.now().isoformat(),
        "is_favorite": False,
        "file_size": file_size,
        "user_id": user["id"]
    }

    add_media(media_item)

    return {
        "success": True,
        "id": file_id,
        "filename": new_filename,
        "file_type": file_type,
        "message": "File uploaded successfully"
    }

@app.post("/api/upload-multiple")
async def upload_multiple_media(
    request: Request,
    files: List[UploadFile] = File(...),
    category: str = Form(default="dates"),
    caption: str = Form(default="")
):
    user = get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")

    results = []

    for file in files:
        ext = get_file_extension(file.filename)
        file_type = get_file_type(file.filename)

        if file_type == "unknown":
            results.append({
                "filename": file.filename,
                "success": False,
                "error": "File type not allowed"
            })
            continue

        file_id = str(uuid.uuid4())
        new_filename = f"{file_id}{ext}"

        if file_type == "image":
            save_path = UPLOAD_DIR / "images" / new_filename
        else:
            save_path = UPLOAD_DIR / "videos" / new_filename

        try:
            with open(save_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)

            file_size = os.path.getsize(save_path)

            media_item = {
                "id": file_id,
                "filename": new_filename,
                "original_name": file.filename,
                "file_type": file_type,
                "category": category,
                "caption": caption,
                "date_taken": datetime.now().strftime("%Y-%m-%d"),
                "created_at": datetime.now().isoformat(),
                "is_favorite": False,
                "file_size": file_size,
                "user_id": user["id"]
            }

            add_media(media_item)

            results.append({
                "filename": file.filename,
                "success": True,
                "id": file_id,
                "file_type": file_type
            })
        except Exception as e:
            results.append({
                "filename": file.filename,
                "success": False,
                "error": str(e)
            })
        finally:
            file.file.close()

    return {"results": results}

@app.get("/api/media")
async def get_all_media(
    request: Request,
    file_type: Optional[str] = None,
    category: Optional[str] = None
):
    user = get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")

    media_list = get_user_media(user["id"], file_type, category)
    return {"media": media_list, "total": len(media_list)}

@app.get("/api/images")
async def get_images(request: Request, category: Optional[str] = None):
    user = get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")

    media_list = get_user_media(user["id"], "image", category)
    return {"media": media_list, "total": len(media_list)}

@app.get("/api/videos")
async def get_videos(request: Request):
    user = get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")

    media_list = get_user_media(user["id"], "video")
    return {"media": media_list, "total": len(media_list)}

@app.get("/api/media/{media_id}")
async def get_media(request: Request, media_id: str):
    user = get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")

    media_item = get_media_by_id(media_id, user["id"])
    if not media_item:
        raise HTTPException(status_code=404, detail="Media not found")

    return media_item

@app.post("/api/media/{media_id}/favorite")
async def toggle_favorite(request: Request, media_id: str):
    user = get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")

    media_item = get_media_by_id(media_id, user["id"])
    if not media_item:
        raise HTTPException(status_code=404, detail="Media not found")

    new_value = not media_item.get("is_favorite", False)
    update_media(media_id, user["id"], {"is_favorite": new_value})

    return {"success": True, "is_favorite": new_value}

@app.delete("/api/media/{media_id}")
async def delete_media(request: Request, media_id: str):
    user = get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")

    deleted = delete_media_item(media_id, user["id"])
    if not deleted:
        raise HTTPException(status_code=404, detail="Media not found")

    # Delete file
    if deleted["file_type"] == "image":
        file_path = UPLOAD_DIR / "images" / deleted["filename"]
    else:
        file_path = UPLOAD_DIR / "videos" / deleted["filename"]

    if file_path.exists():
        os.remove(file_path)

    return {"success": True, "message": "Media deleted successfully"}


# ==================== Profile Image ====================

@app.post("/api/profile-image")
async def upload_profile_image(
    request: Request,
    file: UploadFile = File(...)
):
    user = get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")

    ext = get_file_extension(file.filename)
    if ext not in ALLOWED_IMAGE_EXTENSIONS:
        raise HTTPException(status_code=400, detail="Only image files allowed")

    # Create profile images directory
    profile_dir = UPLOAD_DIR / "profiles"
    profile_dir.mkdir(exist_ok=True)

    # Delete old profile image if exists
    if user.get("profile_image"):
        old_path = UPLOAD_DIR / "profiles" / user["profile_image"]
        if old_path.exists():
            os.remove(old_path)

    # Save new profile image
    new_filename = f"{user['id']}{ext}"
    save_path = profile_dir / new_filename

    try:
        with open(save_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save file: {str(e)}")
    finally:
        file.file.close()

    # Update user data
    data = load_users()
    for u in data["users"]:
        if u["id"] == user["id"]:
            u["profile_image"] = new_filename
            break
    save_users(data)

    return {
        "success": True,
        "profile_image": f"/uploads/profiles/{new_filename}",
        "message": "Profile image updated"
    }

@app.get("/api/profile-image")
async def get_profile_image(request: Request):
    user = get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")

    if user.get("profile_image"):
        return {"profile_image": f"/uploads/profiles/{user['profile_image']}"}
    return {"profile_image": None}


# ==================== Stats ====================

@app.get("/api/stats")
async def get_stats(request: Request):
    user = get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")

    media_list = get_user_media(user["id"])

    image_count = len([m for m in media_list if m["file_type"] == "image"])
    video_count = len([m for m in media_list if m["file_type"] == "video"])
    favorites_count = len([m for m in media_list if m.get("is_favorite")])

    # Calculate days together
    days_together = 0
    if user.get("anniversary"):
        try:
            anniversary_date = datetime.strptime(user["anniversary"], "%Y-%m-%d")
            days_together = max(0, (datetime.now() - anniversary_date).days)
        except:
            pass

    return {
        "images": image_count,
        "videos": video_count,
        "favorites": favorites_count,
        "total": image_count + video_count,
        "days_together": days_together
    }


# ==================== Timeline ====================

@app.get("/api/timeline")
async def get_timeline(request: Request):
    user = get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")

    data = load_timeline()
    user_events = [e for e in data["events"] if e.get("user_id") == user["id"]]
    # Sort by date descending
    user_events.sort(key=lambda x: x.get("event_date", ""), reverse=True)

    return {"events": user_events}

@app.post("/api/timeline")
async def create_timeline_event(
    request: Request,
    title: str = Form(...),
    description: str = Form(default=""),
    event_date: str = Form(...),
    image: Optional[UploadFile] = File(default=None)
):
    user = get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")

    event_id = str(uuid.uuid4())
    image_url = None

    # Handle image upload
    if image and image.filename:
        ext = get_file_extension(image.filename)
        if ext in ALLOWED_IMAGE_EXTENSIONS:
            # Create timeline images directory
            timeline_img_dir = UPLOAD_DIR / "timeline"
            timeline_img_dir.mkdir(exist_ok=True)

            new_filename = f"{event_id}{ext}"
            save_path = timeline_img_dir / new_filename

            try:
                with open(save_path, "wb") as buffer:
                    shutil.copyfileobj(image.file, buffer)
                image_url = f"/uploads/timeline/{new_filename}"
            except Exception as e:
                print(f"Failed to save timeline image: {e}")
            finally:
                image.file.close()

    new_event = {
        "id": event_id,
        "title": title,
        "description": description,
        "event_date": event_date,
        "image": image_url,
        "created_at": datetime.now().isoformat(),
        "user_id": user["id"]
    }

    data = load_timeline()
    data["events"].append(new_event)
    save_timeline(data)

    return {"success": True, "id": event_id, "event": new_event}

@app.delete("/api/timeline/{event_id}")
async def delete_timeline_event(request: Request, event_id: str):
    user = get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")

    data = load_timeline()
    for i, event in enumerate(data["events"]):
        if event["id"] == event_id and event.get("user_id") == user["id"]:
            # Delete image file if exists
            if event.get("image"):
                image_filename = event["image"].split("/")[-1]
                image_path = UPLOAD_DIR / "timeline" / image_filename
                if image_path.exists():
                    os.remove(image_path)

            data["events"].pop(i)
            save_timeline(data)
            return {"success": True, "message": "Event deleted"}

    raise HTTPException(status_code=404, detail="Event not found")


# ==================== Love Notes ====================

def load_notes() -> dict:
    return load_json(NOTES_FILE, {"notes": []})

def save_notes(data: dict):
    save_json(NOTES_FILE, data)

def load_kisses() -> dict:
    return load_json(Path("kisses.json"), {"kisses": []})

def save_kisses(data: dict):
    save_json(Path("kisses.json"), data)

def load_moods() -> dict:
    return load_json(Path("moods.json"), {"moods": []})

def save_moods(data: dict):
    save_json(Path("moods.json"), data)

@app.get("/api/notes")
async def get_notes(request: Request):
    user = get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    data = load_notes()
    user_notes = [note for note in data["notes"] if note.get("user_id") == user["id"]]
    # Sort by created_at descending
    user_notes.sort(key=lambda x: x.get("created_at", ""), reverse=True)
    
    return {"notes": user_notes}

@app.post("/api/notes")
async def create_note(
    request: Request,
    message: str = Form(...),
    color: str = Form(default="pink"),
    author: str = Form(...)
):
    user = get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    note_id = str(uuid.uuid4())
    new_note = {
        "id": note_id,
        "message": message,
        "color": color,
        "author": author,
        "created_at": datetime.now().isoformat(),
        "user_id": user["id"]
    }
    
    data = load_notes()
    data["notes"].append(new_note)
    save_notes(data)
    
    return {"success": True, "note": new_note}

@app.delete("/api/notes/{note_id}")
async def delete_note(request: Request, note_id: str):
    user = get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    data = load_notes()
    for i, note in enumerate(data["notes"]):
        if note["id"] == note_id and note.get("user_id") == user["id"]:
            data["notes"].pop(i)
            save_notes(data)
            return {"success": True, "message": "Note deleted"}
    
    raise HTTPException(status_code=404, detail="Note not found")


# ==================== Virtual Kisses ====================

@app.post("/api/send-kiss")
async def send_kiss(request: Request, to: str = Form(...)):
    user = get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    kiss_id = str(uuid.uuid4())
    new_kiss = {
        "id": kiss_id,
        "from": request.cookies.get("user_identity", "prem"),
        "to": to,
        "created_at": datetime.now().isoformat(),
        "user_id": user["id"]
    }
    
    data = load_kisses()
    data["kisses"].append(new_kiss)
    save_kisses(data)
    
    return {"success": True, "kiss": new_kiss}

@app.get("/api/kisses")
async def get_kisses(request: Request):
    user = get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    data = load_kisses()
    user_kisses = [k for k in data["kisses"] if k.get("user_id") == user["id"]]
    return {"kisses": user_kisses}


# ==================== Mood Tracker ====================

@app.post("/api/mood")
async def set_mood(request: Request, mood: str = Form(...), message: str = Form(default="")):
    user = get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    author = request.cookies.get("user_identity", "prem")
    today = datetime.now().date().isoformat()
    
    data = load_moods()
    # Remove today's mood if exists
    data["moods"] = [m for m in data["moods"] if not (m.get("author") == author and m.get("date") == today)]
    
    new_mood = {
        "id": str(uuid.uuid4()),
        "mood": mood,
        "message": message,
        "author": author,
        "date": today,
        "created_at": datetime.now().isoformat(),
        "user_id": user["id"]
    }
    
    data["moods"].append(new_mood)
    save_moods(data)
    
    return {"success": True, "mood": new_mood}

@app.get("/api/moods")
async def get_moods(request: Request):
    user = get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    data = load_moods()
    today = datetime.now().date().isoformat()
    user_moods = [m for m in data["moods"] if m.get("user_id") == user["id"] and m.get("date") == today]
    
    return {"moods": user_moods}


# ==================== Love Meter ====================

@app.get("/api/love-meter")
async def get_love_meter(request: Request):
    user = get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    # Calculate love score based on interactions
    media_count = len(get_user_media(user["id"]))
    notes_count = len(load_notes()["notes"])
    timeline_count = len([e for e in load_timeline()["events"] if e.get("user_id") == user["id"]])
    kisses_count = len([k for k in load_kisses()["kisses"] if k.get("user_id") == user["id"]])
    
    # Calculate score (max 100)
    score = min(100, (media_count * 2) + (notes_count * 5) + (timeline_count * 8) + (kisses_count * 3))
    
    return {
        "score": score,
        "media_count": media_count,
        "notes_count": notes_count,
        "timeline_count": timeline_count,
        "kisses_count": kisses_count
    }


if __name__ == "__main__":
    import uvicorn
    print("Starting Love Album server with fun features...")
    uvicorn.run(app, host="127.0.0.1", port=2108)
