from mycroft import MycroftSkill, intent_file_handler, intent_handler
from adapt.intent import IntentBuilder
from mycroft.util.log import getLogger
import requests
import json
import os
import re

LOGGER = getLogger(__name__)

# Get API URL from environment or use default
API_URL = os.getenv("API_URL", "http://localhost:9000/api")

class VoiceAgentSkill(MycroftSkill):
    def __init__(self):
        MycroftSkill.__init__(self)
        self.candidate_id = None
        self.job_id = None
        self.conversation_stage = None
        self.available_date = None
        self.available_time = None
        self.notice_period = None
        self.current_ctc = None
        self.expected_ctc = None
        self.company_name = "YourCompany"
        self.job_description = ""
        self.candidate_name = ""

    @intent_file_handler('start.interview.intent')
    def handle_start_interview(self, message):
        self.speak_dialog('interview.start')
        self.get_candidate_and_job_ids()

    def get_candidate_and_job_ids(self):
        # Ask for candidate ID
        self.candidate_id = self.get_response('ask.candidate.id')
        if not self.candidate_id or not self.candidate_id.isdigit():
            self.speak_dialog('invalid.candidate.id')
            return self.get_candidate_and_job_ids()

        # Ask for job ID
        self.job_id = self.get_response('ask.job.id')
        if not self.job_id or not self.job_id.isdigit():
            self.speak_dialog('invalid.job.id')
            return self.get_candidate_and_job_ids()

        # Fetch candidate and job information
        self.fetch_candidate_and_job_info()

    def fetch_candidate_and_job_info(self):
        try:
            # Get candidate information
            candidate_response = requests.get(f"{API_URL}/candidates/{self.candidate_id}")
            if candidate_response.status_code != 200:
                self.speak_dialog('candidate.not.found')
                return self.get_candidate_and_job_ids()

            candidate = candidate_response.json()
            self.candidate_name = candidate.get("name", "")

            # Get job information
            job_response = requests.get(f"{API_URL}/jobs/{self.job_id}")
            if job_response.status_code != 200:
                self.speak_dialog('job.not.found')
                return self.get_candidate_and_job_ids()

            job = job_response.json()
            self.job_description = job.get("description", "")

            # Start the interview flow
            self.start_interview_flow()

        except Exception as e:
            LOGGER.error(f"Error fetching information: {str(e)}")
            self.speak_dialog('error.fetching.info')

    def start_interview_flow(self):
        # Set initial stage
        self.conversation_stage = "greeting"
        
        # Process greeting
        self.process_dialogue("greeting")

    def process_dialogue(self, user_input):
        try:
            # Prepare context
            context = {
                "stage": self.conversation_stage,
                "jobId": self.job_id,
                "candidateName": self.candidate_name,
                "companyName": self.company_name,
                "jobDescription": self.job_description
            }

            # Call backend to process dialogue
            response = requests.post(
                f"{API_URL}/conversations/process-text",
                json={
                    "candidateId": self.candidate_id,
                    "text": user_input,
                    "context": context
                }
            )

            if response.status_code != 200:
                self.speak_dialog('error.processing')
                return

            result = response.json()
            
            # Extract entities
            entities = result.get("entities", {})
            
            # Update conversation state
            self.update_state_from_entities(entities)
            
            # Update conversation stage
            self.conversation_stage = result.get("nextStage")
            
            # Speak the response
            self.speak(result.get("response"))
            
            # Book appointment if confirmed
            if self.conversation_stage == "questions" and self.available_date and self.available_time:
                self.book_appointment()
            
            # End conversation if we've reached the end
            if self.conversation_stage == "end":
                self.speak_dialog('interview.end')
                return
            
            # Get next user input
            next_input = self.get_response('continue.conversation')
            if next_input:
                self.process_dialogue(next_input)
            
        except Exception as e:
            LOGGER.error(f"Error in dialogue: {str(e)}")
            self.speak_dialog('error.processing')
    
    def update_state_from_entities(self, entities):
        # Update notice period
        if "noticePeriod" in entities:
            self.notice_period = entities["noticePeriod"]
        
        # Update CTC
        if "currentCtc" in entities:
            self.current_ctc = entities["currentCtc"]
        if "expectedCtc" in entities:
            self.expected_ctc = entities["expectedCtc"]
        
        # Update availability
        if "availableDate" in entities:
            self.available_date = entities["availableDate"]
        if "availableTime" in entities:
            self.available_time = entities["availableTime"]
    
    def book_appointment(self):
        try:
            # Format date and time
            date_time_str = f"{self.available_date} {self.available_time}"
            
            # Book appointment via backend API
            response = requests.post(
                f"{API_URL}/appointments",
                json={
                    "jobId": self.job_id,
                    "candidateId": self.candidate_id,
                    "dateTime": date_time_str,
                    "status": "scheduled"
                }
            )
            
            if response.status_code != 201 and response.status_code != 200:
                LOGGER.error("Failed to book appointment")
            
        except Exception as e:
            LOGGER.error(f"Error booking appointment: {str(e)}")
    
    @intent_handler(IntentBuilder('CancelInterviewIntent').require('cancel').require('interview'))
    def handle_cancel_interview(self, message):
        self.speak_dialog('interview.cancel')
        self.reset_interview()
    
    def reset_interview(self):
        self.candidate_id = None
        self.job_id = None
        self.conversation_stage = None
        self.available_date = None
        self.available_time = None
        self.notice_period = None
        self.current_ctc = None
        self.expected_ctc = None
        self.job_description = ""
        self.candidate_name = ""

def create_skill():
    return VoiceAgentSkill()