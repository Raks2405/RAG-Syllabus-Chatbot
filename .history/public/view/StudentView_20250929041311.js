import { AbstractView } from "./AbstractView.js";
import { getSyllabiFromFirestore } from "../controller/firestore_controller.js";

export class StudentView extends AbstractView {
  controller = null;
  syllabusTextMap = {};

  constructor(controller) {
    super();
    this.controller = controller;
  }

  isPublicView() {
    return true;
  }

  async onMount() {
    console.log('StudentView.onMount() called');
  }

  async updateView() {
    console.log('StudentView.updateView() called');
    const viewWrapper = document.createElement('div');
    const response = await fetch('/view/templates/student.html', { cache: 'no-store' });
    viewWrapper.innerHTML = await response.text();
    return viewWrapper;
  }

  attachEvents() {
    console.log('StudentView.attachEvents() called');
    this.setupFormLogic();
  }

  async onLeave() {
    console.log('StudentView.onLeave() called');
  }

  setupFormLogic() {
    
      const departmentSelect = document.getElementById("department");
      const courseNumberSelect = document.getElementById("courseNumber");
      const courseNameSelect = document.getElementById("courseName");
      const submitBtn = document.getElementById("submit-btn");
      const browseForm = document.getElementById("student-form");
  
      const courses = {
        CS: [
          { number: "CS5043", name: "Software Engineering" },
          { number: "CS5053", name: "Database Management Systems" },
          { number: "CS5063", name: "Advanced C++" },
          { number: "CS5073", name: "Python Programming" },
        ],
        BA: [
          { number: "BA5043", name: "Data Visualization" },
          { number: "BA5053", name: "Marketing Analysis" },
          { number: "BA5063", name: "Introduction to Business Analytics" },
          { number: "BA5073", name: "Advanced Business Analytics" },
        ],
        CY: [
          { number: "CY5043", name: "Introduction to Cyber Security" },
          { number: "CY5053", name: "Incident Analysis" },
          { number: "CY5063", name: "Network Security" },
        ],
        DS: [
          { number: "DS5043", name: "Data Mining" },
          { number: "DS5053", name: "Algorithms and Design" },
          { number: "DS5063", name: "Data Analysis" },
        ]
      };
  
      function checkFormCompletion() {
        const isComplete = departmentSelect.value && courseNumberSelect.value && courseNameSelect.value;
        submitBtn.disabled = !isComplete;
      }
  
      departmentSelect.addEventListener("change", function () {
        const selectedDept = departmentSelect.value;
        courseNumberSelect.innerHTML = '<option value="">Select Course Number</option>';
        courseNameSelect.innerHTML = '<option value="">Select Course Name</option>';
  
        if (selectedDept && courses[selectedDept]) {
          courseNumberSelect.disabled = false;
          courseNameSelect.disabled = false;
  
          for (const course of courses[selectedDept]) {
            const option = document.createElement("option");
            option.value = course.number;
            option.textContent = course.number;
            courseNumberSelect.appendChild(option);
  
            const optionName = document.createElement("option");
            optionName.value = course.name;
            optionName.textContent = course.name;
            courseNameSelect.appendChild(optionName);
          }
        } else {
          courseNumberSelect.disabled = true;
          courseNameSelect.disabled = true;
        }
        checkFormCompletion();
      });
  
      courseNumberSelect.addEventListener("change", function () {
        const selectedNumber = courseNumberSelect.value;
        const selectedDept = departmentSelect.value;
        if (selectedDept && courses[selectedDept]) {
          const course = courses[selectedDept].find(c => c.number === selectedNumber);
          if (course) courseNameSelect.value = course.name;
        }
        checkFormCompletion();
      });
  
      courseNameSelect.addEventListener("change", function () {
        const selectedName = courseNameSelect.value;
        const selectedDept = departmentSelect.value;
        if (selectedDept && courses[selectedDept]) {
          const course = courses[selectedDept].find(c => c.name === selectedName);
          if (course) courseNumberSelect.value = course.number;
        }
        checkFormCompletion();
      });
  
      browseForm.addEventListener("submit", (e) => {
        e.preventDefault();
        this.controller.onSubmitStudentForm();
      });
  
      submitBtn.disabled = true;
    }

    async renderSyllabiList(syllabiList) {
      const listContainer = document.getElementById('student-syllabi-list');
      listContainer.innerHTML = "";
  
      if (syllabiList.length === 0) {
        listContainer.innerHTML = "<p class='text-center'>No matching syllabi found.</p>";
        return;
      }
  
      // Add the modal chat styles
      this.addModalChatStyles();
  
      for (const [index, syllabus] of syllabiList.entries()) {
        console.log('🧾 Full syllabus object:', syllabus);
        console.log('📄 PDF URL:', syllabus.fileUrl);
  
        const div = document.createElement("div");
        div.className = "card mb-3 syllabus-card";
        div.innerHTML = `
          <div class="card-body">
            <div class="d-flex justify-content-between align-items-center">
              <div>
                <h5 class="card-title mb-1">${syllabus.courseNumber} - ${syllabus.courseName}</h5>
                <p class="card-text text-muted">${syllabus.department}</p>
              </div>
              <div class="d-flex gap-2">
                <a href="${syllabus.fileUrl}" target="_blank" class="btn btn-sm btn-primary">
                  <i class="bi bi-file-earmark-pdf"></i> View PDF
                </a>
                <button class="btn btn-sm btn-success ask-button" data-index="${index}">
                  <i class="bi bi-chat-left-text"></i> Ask Questions
                </button>
              </div>
            </div>
          </div>
        `;
        listContainer.appendChild(div);
  
        // PDF text extraction with detailed logging
        const pdfUrl = syllabus.fileUrl;
        if (!pdfUrl || typeof pdfUrl !== "string") {
          console.error('❌ Invalid PDF URL for syllabus:', syllabus);
          this.syllabusTextMap[index] = "⚠️ Could not load PDF content.";
        } else {
          try {
            console.log(`📥 Fetching PDF content for ${syllabus.courseNumber}...`);
            const syllabusText = await this.extractPdfText(pdfUrl);
            console.log(`📑 Extracted text from PDF (${syllabus.courseNumber}):`, syllabusText);
            this.syllabusTextMap[index] = syllabusText;
          } catch (e) {
            console.error(`❌ PDF extraction failed for ${syllabus.courseNumber}:`, e);
            this.syllabusTextMap[index] = "⚠️ PDF loading error: " + e.message;
          }
        }
  
        // Create modal chat dialog
        const modalDialog = document.createElement("div");
        modalDialog.className = "chat-modal";
        modalDialog.id = `chatModal-${index}`;
        modalDialog.innerHTML = `
          <div class="chat-modal-content">
            <div class="chat-modal-header">
              <h5>Ask Questions About ${syllabus.courseNumber} - ${syllabus.courseName}</h5>
              <button type="button" class="close-chat-btn" data-index="${index}">
                <span>&times;</span>
              </button>
            </div>
            <div class="chat-modal-body">
              <div class="chat-messages" id="chatMessages-${index}"></div>
            </div>
            <div class="chat-modal-footer">
              <div class="input-group">
                <input type="text" 
                      id="chatInput-${index}" 
                      class="form-control" 
                      placeholder="Type your question about this syllabus...">
                <div class="input-group-append">
                  <button class="btn btn-primary chat-send-btn" id="sendButton-${index}" data-index="${index}">
                    <i class="bi bi-send-fill"></i> Send
                  </button>
                </div>
              </div>
            </div>
          </div>
        `;
        document.body.appendChild(modalDialog);
  
        // Event listeners
        const askButton = div.querySelector(`.ask-button[data-index="${index}"]`);
        const modal = document.getElementById(`chatModal-${index}`);
        const closeButton = modal.querySelector(`.close-chat-btn[data-index="${index}"]`);
        const sendButton = modal.querySelector(`#sendButton-${index}`);
        const chatInput = modal.querySelector(`#chatInput-${index}`);
        const chatMessages = modal.querySelector(`#chatMessages-${index}`);
  
        askButton.addEventListener("click", () => {
          console.log(`Opening chat for ${syllabus.courseName}`);
          modal.style.display = "block";
          chatInput.focus();
        });
  
        closeButton.addEventListener("click", () => {
          console.log(`Closing chat for ${syllabus.courseName}`);
          modal.style.display = "none";
        });
  
        // Close when clicking outside modal
        window.addEventListener("click", (event) => {
          if (event.target === modal) {
            modal.style.display = "none";
          }
        });
  
        sendButton.addEventListener("click", async () => {
          const userMessage = chatInput.value.trim();
          if (userMessage === '') return;
  
          console.log(` User question for ${syllabus.courseNumber}:`, userMessage);
          
          // Add user message
          const userMsgDiv = document.createElement('div');
          userMsgDiv.className = 'message user-message';
          userMsgDiv.innerHTML = `
            <div class="message-content">
              <div class="message-text">${userMessage}</div>
              <div class="message-time">${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
            </div>
          `;
          chatMessages.appendChild(userMsgDiv);
          chatInput.value = "";
          chatMessages.scrollTop = chatMessages.scrollHeight;
  
          // Add typing indicator
          const typingDiv = document.createElement('div');
          typingDiv.className = 'message bot-message';
          typingDiv.innerHTML = `
            <div class="message-content">
              <div class="typing-indicator">
                <span>AI is typing...</span>
                <span class="typing-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </span>
              </div>
            </div>
          `;
          chatMessages.appendChild(typingDiv);
          chatMessages.scrollTop = chatMessages.scrollHeight;
  
          try {
            const combinedPrompt = `Syllabus Content:\n${this.syllabusTextMap[index]}\n\nQuestion: ${userMessage}`;
            console.log(`Sending to LLM for ${syllabus.courseNumber}:`, combinedPrompt);
            
            const botReply = await this.talkToLLM(combinedPrompt);
            console.log(`Bot Response for ${syllabus.courseNumber}:`, botReply);
            
            // Replace typing indicator with response
            typingDiv.innerHTML = `
              <div class="message-content">
                <div class="message-text">${botReply}</div>
                <div class="message-time">${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
              </div>
            `;
          } catch (error) {
            console.error(`Error in LLM response for ${syllabus.courseNumber}:`, error);
            typingDiv.innerHTML = `
              <div class="message-content error-message">
                <div class="message-text">❌ Error: ${error.message}</div>
              </div>
            `;
          }
          chatMessages.scrollTop = chatMessages.scrollHeight;
        });
  
        // Allow sending with Enter key
        chatInput.addEventListener("keypress", (e) => {
          if (e.key === "Enter") {
            sendButton.click();
          }
        });
      }
    }
  
    addModalChatStyles() {
      const style = document.createElement('style');
      style.textContent = `
        /* Chat Modal Styling */
        .chat-modal {
          display: none;
          position: fixed;
          z-index: 1050;
          left: 0;
          top: 0;
          width: 100%;
          height: 100%;
          overflow: auto;
          background-color: rgba(0,0,0,0.4);
        }
        
        .chat-modal-content {
          background-color: #fefefe;
          margin: 2% auto;
          padding: 0;
          border: 1px solid #888;
          width: 70%;
          height: 85vh;
          max-width: 900px;
          min-width: 300px;
          border-radius: 8px;
          box-shadow: 0 4px 8px 0 rgba(0,0,0,0.2);
          display: flex;
          flex-direction: column;
        }
        
        .chat-modal-header {
          padding: 16px;
          background-color: #007bff;
          color: white;
          border-top-left-radius: 8px;
          border-top-right-radius: 8px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-shrink: 0;
        }
        
        .chat-modal-header h5 {
          margin: 0;
          font-size: 1.25rem;
        }
        
        .close-chat-btn {
          color: white;
          font-size: 1.5rem;
          font-weight: bold;
          background: transparent;
          border: none;
          cursor: pointer;
        }
        
        .close-chat-btn:hover {
          color: #f8f9fa;
        }
        
        .chat-modal-body {
          padding: 16px;
          overflow-y: auto;
          flex: 1;
          background-color: #f8f9fa;
        }
        
        .chat-modal-footer {
          padding: 16px;
          background-color: white;
          border-top: 1px solid #dee2e6;
          border-bottom-left-radius: 8px;
          border-bottom-right-radius: 8px;
          flex-shrink: 0;
        }
        
        /* Message Styling */
        .chat-messages {
          display: flex;
          flex-direction: column;
          gap: 12px;
          min-height: calc(100% - 20px);
        }
        
        /* Responsive adjustments */
        @media (max-width: 1200px) {
          .chat-modal-content {
            width: 80%;
            height: 80vh;
          }
        }
        
        @media (max-width: 992px) {
          .chat-modal-content {
            width: 85%;
            height: 75vh;
          }
        }
        
        @media (max-width: 768px) {
          .chat-modal-content {
            width: 90%;
            height: 70vh;
            margin: 5% auto;
          }
          
          .chat-modal-header h5 {
            font-size: 1.1rem;
          }
        }
        
        @media (max-width: 576px) {
          .chat-modal-content {
            width: 95%;
            height: 80vh;
            margin: 2% auto;
          }
          
          .chat-modal-header,
          .chat-modal-footer {
            padding: 12px;
          }
        }
        
        /* Rest of your existing styles... */
        .message {
          max-width: 80%;
        }
        
        .user-message {
          align-self: flex-end;
        }
        
        .bot-message {
          align-self: flex-start;
        }
        
        .message-content {
          padding: 10px 14px;
          border-radius: 18px;
        }
        
        .user-message .message-content {
          background-color: #007bff;
          color: white;
          border-bottom-right-radius: 4px;
        }
        
        .bot-message .message-content {
          background-color: #e9ecef;
          color: #212529;
          border-bottom-left-radius: 4px;
        }
        
        .error-message .message-content {
          background-color: #f8d7da;
          color: #721c24;
        }
        
        .message-text {
          word-wrap: break-word;
        }
        
        .message-time {
          font-size: 0.75rem;
          opacity: 0.8;
          margin-top: 4px;
          text-align: right;
        }
        
        .typing-indicator {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        
        .typing-dots {
          display: inline-flex;
          gap: 3px;
        }
        
        .typing-dots span {
          width: 6px;
          height: 6px;
          background-color: #6c757d;
          border-radius: 50%;
          display: inline-block;
          animation: bounce 1.4s infinite ease-in-out;
        }
        
        .typing-dots span:nth-child(2) {
          animation-delay: 0.2s;
        }
        
        .typing-dots span:nth-child(3) {
          animation-delay: 0.4s;
        }
        
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-3px); }
        }
      `;
      document.head.appendChild(style);
    }

  // Keep all existing methods exactly the same below
  async extractPdfText(url) {
    console.log("📄 extractPdfText called with:", url);
    if (!url || typeof url !== "string") {
      console.error("❌ Invalid URL passed to extractPdfText:", url);
      throw new Error("Invalid URL passed to extractPdfText");
    }

    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.10.377/pdf.worker.min.js';
    const pdf = await pdfjsLib.getDocument(url).promise;
    let text = "";

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      text += content.items.map(item => item.str).join(" ");
    }

    return text;
  }

  async talkToLLM(prompt) {
    const LLAMA_API_URL = " https://gemini-proxy-113410734669.us-central1.run.app/generate"; 

    const payload = {
      prompt: prompt,
      max_tokens: 250,
      temperature: 0.7,
      top_p: 1.0,
      repetition_penalty: 1.0,
      top_k: 50
    };

    try {
      const response = await fetch(LLAMA_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('Server error:', errorData);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.response.content;
    } catch (error) {
      console.error('Error occurred while calling the API:', error);
      throw error;
    }
  }
}