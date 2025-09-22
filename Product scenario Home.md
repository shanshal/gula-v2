## Product scenario
- Home security app with aswar touches here and there in the frontend
- Connect to either a web cam or a cctv 
- Handle fingerprints and sessions 
- Manage who goes where and when

# Endpoints we need
- Not sure how you guys wanna handle auth
- Health endpoint (Optional honestly but would be nice to have)
- Users
    - GET /users all users {id, username, name, createdAt, lastSeen}
    - POST /users {username, name, fingerprints} -> create a user with username, name, id, createdAt,
    - GET /users/{id} return everything related to that user including their fingerprints and access log history 
    - PATCH /users/{id} This will probably be used to add fingerprints to a user
    - DELETE /users/{id}
    
- A socket to "Connect to scanner"
- Scanner will start scanning and send to backend to process while that is happening frontend should get a preview of the scan
- Fingerprints
    - Return all fingerprints that resulted from matching and sort them according to their cert
    - Each fingerprint should have the user id and certinity and the fingerprint itself
- Enrolling or registering call it what you want
    - POST /users {user_id, full_name, an array of scans or fingeprints}
    - Patch to edit whatever we need
    - Delete /users/{id} 
- Search 
    - GET /users return all users with {name, id, enrolled or not(Basically if they have a fingerprint or not maybe this one is not necessary ), last time they scanned, number of scans they got}
    - GET /user/{id} Total scans, every scan they had on what device and when 
