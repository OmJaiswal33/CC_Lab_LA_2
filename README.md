# CloudDrive: Scalable Cloud Object Storage Vault

A full-stack, cloud-native file storage system (Google Drive clone) designed to directly demonstrate core Cloud Computing (CC) lab practicals on AWS.

---

## 🎯 Direct Practical Mapping (No Force-Fitting)

| Practical | AWS Service | Role in CloudDrive |
|---|---|---|
| **Practical 1** | **Amazon EC2** | Hosts the backend API server and serves the web application. |
| **Practical 2** | **AWS Elastic Beanstalk** | Deploys the Python web application with zero manual infrastructure configuration. |
| **Practical 3** | **Amazon S3** | Stores raw file objects (`files/...`) with **Bucket Versioning** enabled to maintain revision history. |
| **Practical 6** | **Amazon VPC** | Network isolation: Public Subnet for EC2/Internet Gateway; Private Subnet for RDS. |
| **Practical 7** | **Amazon RDS (MySQL)** | Stores structured file metadata (`id`, `original_name`, `file_type`, `file_size`, `s3_key`, `uploaded_at`). |
| **Practical 8** | **AWS IAM** | Attaches an IAM Role with `AmazonS3FullAccess` to the EC2 instance for credential-less S3 access. |

---

## 💻 1. Quick Local Run (Works 100% Offline Without AWS)

Both backend and frontend can be tested locally right now. When running locally, files are saved to `backend/media/files/` and metadata is stored in a local SQLite file.

### Backend (Django)
```bash
cd backend

# Activate virtual environment:
# On Windows PowerShell:
.\venv\Scripts\activate

# Run database migrations (already applied):
python manage.py migrate

# Start the Django development server:
python manage.py runserver 8000
```
API endpoint: `http://localhost:8000/api/files/`

### Frontend (React + Vite)
```bash
cd frontend

# Install dependencies (already installed):
npm install

# Start frontend dev server:
npm run dev
```
Open in browser: `http://localhost:5173`

---

## ☁️ 2. Deploying to AWS (Step-by-Step Practical Guide)

When you are ready to demonstrate the project on AWS, follow these steps in your AWS Console:

### Step 1: Create VPC (Practical 6)
1. Go to **AWS VPC Console** $\to$ **Create VPC** $\to$ Select **VPC and more**.
2. **Name tag:** `clouddrive-vpc`
3. **IPv4 CIDR:** `10.0.0.0/16`
4. Number of Availability Zones: `2`
5. Number of Public Subnets: `2` (e.g., `10.0.1.0/24`, `10.0.2.0/24`)
6. Number of Private Subnets: `2` (e.g., `10.0.10.0/24`, `10.0.11.0/24`)
7. NAT Gateways: None (to save cost)
8. Click **Create VPC**.

---

### Step 2: Create S3 Bucket (Practical 3)
1. Go to **AWS S3 Console** $\to$ Click **Create bucket**.
2. **Bucket name:** `clouddrive-vault-om` (must be globally unique).
3. **AWS Region:** `ap-south-1` (Mumbai) or your chosen region.
4. **Bucket Versioning:** Choose **Enable** (Satisfies Practical 3 requirements).
5. **Block Public Access:** You can uncheck "Block all public access" or keep it enabled and use presigned URLs.
6. Click **Create bucket**.

---

### Step 3: Create RDS MySQL Database (Practical 7)
1. Go to **AWS RDS Console** $\to$ Click **Create database**.
2. Choose **Standard create** $\to$ Engine: **MySQL**.
3. Templates: Choose **Free tier**.
4. **DB instance identifier:** `clouddrive-db`
5. **Master username:** `admin`
6. **Master password:** `clouddrive123` (or your choice).
7. Under **Connectivity**:
   - Virtual Private Cloud (VPC): Choose `clouddrive-vpc`.
   - Subnet group: Private subnets.
   - Public access: **No** (Secured inside VPC).
   - VPC Security Group: Create new, allow Inbound **MySQL/Aurora (Port 3306)** only from the EC2 security group.
8. Under **Initial database name**: enter `clouddrive`.
9. Click **Create database**. Copy the **Endpoint** when created.

---

### Step 4: Create IAM Role for EC2 (Practical 8)
1. Go to **AWS IAM Console** $\to$ **Roles** $\to$ **Create role**.
2. Trusted entity type: **AWS service** $\to$ Use case: **EC2**.
3. Permissions: Search and select **AmazonS3FullAccess**.
4. Role name: `CloudDrive-EC2-S3-Role`.
5. Click **Create role**.

---

### Step 5: Launch EC2 Instance (Practical 1 & 8)
1. Go to **AWS EC2 Console** $\to$ **Launch instances**.
2. Name: `CloudDrive-Server`.
3. AMI: **Ubuntu Server 22.04 LTS** (or Amazon Linux 2023).
4. Instance type: `t2.micro` (Free tier).
5. Key pair: Select or create your `.pem` key.
6. Under **Network settings**:
   - VPC: Select `clouddrive-vpc`.
   - Subnet: Select a **Public subnet** (e.g., `10.0.1.0/24`).
   - Auto-assign public IP: **Enable**.
   - Security group: Allow **SSH (Port 22)** from your IP, and **Custom TCP (Port 8000)** from Anywhere (`0.0.0.0/0`).
7. Under **Advanced details**:
   - **IAM instance profile**: Select `CloudDrive-EC2-S3-Role` (Practical 8).
8. Click **Launch instance**.

---

### Step 6: Connect Backend to AWS RDS & S3
In your `backend/.env` file on EC2 (or locally to test with AWS):
```env
USE_AWS_RDS=True
RDS_HOST=<your-rds-endpoint>
RDS_DB_NAME=clouddrive
RDS_USER=admin
RDS_PASSWORD=clouddrive123
RDS_PORT=3306

AWS_STORAGE_BUCKET_NAME=clouddrive-vault-om
AWS_S3_REGION_NAME=ap-south-1
```
Run migrations on EC2:
```bash
python manage.py migrate
python manage.py runserver 0.0.0.0:8000
```
Your CloudDrive application is now 100% powered by **EC2**, **S3**, **RDS**, **VPC**, and **IAM**!
