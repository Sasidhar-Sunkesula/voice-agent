# Voice Agent Mycroft Scripts

This directory contains the Mycroft-based voice agent scripts for the interview scheduling system.

## Overview

These scripts implement a conversational AI flow using Mycroft for handling candidate interviews. The flow follows the same conversation stages as implemented in the backend service:

1. Greeting
2. Interest check
3. Notice period collection
4. CTC information collection
5. Availability scheduling
6. Confirmation
7. Questions handling

## Directory Structure

- `__init__.py`: Main skill initialization file
- `vocab/`: Contains vocabulary files for intent matching
  - `en-us/`: English vocabulary files
- `dialog/`: Contains dialog responses
  - `en-us/`: English dialog files
- `settingsmeta.json`: Skill settings metadata
- `requirements.txt`: Python dependencies

## Integration with Backend

This Mycroft skill integrates with the existing backend API. It makes HTTP requests to the backend endpoints for:

- Fetching candidate information
- Fetching job information
- Processing dialogue
- Booking appointments
- Saving conversations

## Setup

1. Install Mycroft:
   ```bash
   git clone https://github.com/MycroftAI/mycroft-core.git
   cd mycroft-core
   ./dev_setup.sh
   ```

2. Install this skill:
   ```bash
   cd ~/mycroft-core/skills
   git clone [your-repo-url] voice-agent-skill
   cd voice-agent-skill
   pip install -r requirements.txt
   ```

3. Restart Mycroft:
   ```bash
   mycroft-start restart all
   ```

## Usage

To use the voice agent skill with Mycroft:

1. Start a conversation with "Hey Mycroft, start interview agent"
2. Provide the candidate ID and job ID when prompted
3. Follow the conversation flow as guided by the agent

## Customization

You can customize the skill by:

1. Adding more vocabulary terms in the `vocab/` directory
2. Modifying dialog responses in the `dialog/` directory
3. Updating the API integration in the `__init__.py` file