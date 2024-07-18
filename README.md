# InvoClass

InvoClass is a SaaS platform designed to provide a comprehensive solution for managing virtual classrooms. It integrates various functionalities such as virtual machine management, real-time notifications, and over-the-shoulder monitoring to enhance the teaching and learning experience.

## Features

- **Dynamic Dashboard**: Overview of classroom activities, VM statuses, and notifications.
- **VM Management**: Create, customize, and manage virtual machines.
- **Real-time Updates**: Notifications for VM deployments, VM health, file uploads, and other activities.
- **Over-the-Shoulder Monitoring**: Instructors can monitor student activities in real-time.
- **User Authentication**: Secure login and role-based access control.
- **Customizable Templates**: Save and use customized VM templates.

## Technologies Used

- **Frontend**: React, React Router, Styled Components, Material UI.
- **Backend**: Node.js, Express.js, Python
- **Database**: DynamoDB
- **Real-time Communication**: WebSockets via API Gateway
- **Cloud Services**: AWS and Azure

## AWS Services Used

In this project, the following AWS services were utilized to enhance functionality and performance:

- **AWS DynamoDB**: For scalable and fast data storage.
- **AWS API Gateway**: To create, publish, maintain, monitor, and secure APIs.
- **AWS Lambda**: For running backend code in response to events and HTTP requests without provisioning servers.
- **Amazon S3**: For storing static assets and build files.
- **AWS CloudWatch**: For monitoring and logging application metrics and logs.
- **AWS IAM**: For managing access to AWS services and resources securely.
- **AWS CloudFormation**: For provisioning and managing infrastructure as code.
- **AWS Cognito**: For user authentication and authorization, providing secure access to the platform.
- **AWS Amplify**: For deploying and managing the frontend application with ease.
- **Amazon CloudWatch**: For monitoring and logging application metrics and logs, ensuring operational health.
- **Amazon EventBridge**: For event-driven architecture to manage and route events from different sources.
- **AWS Elastic Beanstalk**: For deploying and scaling web applications and services.
- **Amazon EC2**: For providing scalable compute capacity in the cloud to run various backend services.

## Azure Services Used

In this project, the following Azure services were utilized to manage virtual machines and resources:

- **Azure Virtual Machines**: For providing scalable compute resources to run various workloads and services.
- **Azure Resource Management**: For organizing and managing Azure resources efficiently.
- **Azure Network Management**: For configuring and managing virtual networks, ensuring secure and reliable connectivity.

## SDKs Used

The project utilizes various SDKs to interact with cloud services programmatically:

- **AWS SDK for Node.js**: Used to interact with AWS services such as DynamoDB, S3, and more, enabling server-side operations.
- **AWS SDK for Python (Boto3)**: Used for scripting and automating interactions with AWS services, including Lambda and EC2.
- **Azure SDK for Python**: Used to manage Azure resources programmatically, including virtual machines, resource groups, and networks.
  
## Getting Started

Follow these instructions to set up the project locally.

### Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)
- AWS account for cloud services setup

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/YourUsername/InvoClass.git
   cd InvoClass
   npm install
   npm start

### Usage

    User Authentication: Sign up or log in to access the platform.
    Dashboard: View real-time updates and manage virtual classrooms.
    VM Management: Create and customize virtual machines as per your requirements.
    Monitoring: Use the over-the-shoulder monitoring feature to oversee student activities.

