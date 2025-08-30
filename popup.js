document.addEventListener('DOMContentLoaded', function() {
    console.log('Study Helper Extension loaded');
    // State management
    let backendUrl = 'https://extension-study.onrender.com';
    let flashcards = [];
    let currentCardIndex = 0;
    let quizQuestions = [];
    let currentQuestionIndex = 0;
    let userScore = 0;
    let selectedOption = null;
    let isTextSchoolRelated = false; // New state to track if text is school-related
    let flashcardCount = 5; // Default number of flashcards
    let quizCount = 5; // Default number of quiz questions
    
    // DOM Elements
    const inputText = document.getElementById('inputText');
    const checkTextBtn = document.getElementById('checkText');
    const checkStatus = document.getElementById('checkStatus');
    const generateFlashcardsBtn = document.getElementById('generateFlashcards');
    const generateQuizBtn = document.getElementById('generateQuiz');
    const generateStatus = document.getElementById('generateStatus');
    const flashcardsContainer = document.getElementById('flashcardsContainer');
    const flashcardsList = document.getElementById('flashcardsList');
    const prevCardBtn = document.getElementById('prevCard');
    const nextCardBtn = document.getElementById('nextCard');
    const cardCounter = document.getElementById('cardCounter');
    const quizContainer = document.getElementById('quizContainer');
    const progressText = document.getElementById('progressText');
    const currentQuestion = document.getElementById('currentQuestion');
    const quizOptions = document.getElementById('quizOptions');
    const prevQuestionBtn = document.getElementById('prevQuestion');
    const nextQuestionBtn = document.getElementById('nextQuestion');
    const answerFeedback = document.getElementById('answerFeedback');
    const quizResult = document.getElementById('quizResult');
    const finalScore = document.getElementById('finalScore');
    const resultMessage = document.getElementById('resultMessage');
    const restartQuizBtn = document.getElementById('restartQuiz');
    
    // Settings elements
    const settingsBtn = document.getElementById('settingsBtn');
    const settingsModal = document.getElementById('settingsModal');
    const closeSettings = document.getElementById('closeSettings');
    const flashcardCountSlider = document.getElementById('flashcardCount');
    const flashcardCountValue = document.getElementById('flashcardCountValue');
    const quizCountSlider = document.getElementById('quizCount');
    const quizCountValue = document.getElementById('quizCountValue');
    
    // Verify all DOM elements are found
    const requiredElements = [
        inputText, checkTextBtn, checkStatus, generateFlashcardsBtn, generateQuizBtn,
        generateStatus, flashcardsContainer, flashcardsList, prevCardBtn, nextCardBtn,
        cardCounter, quizContainer, progressText, currentQuestion,
        quizOptions, prevQuestionBtn, nextQuestionBtn, answerFeedback,
        quizResult, finalScore, resultMessage, restartQuizBtn,
        settingsBtn, settingsModal, closeSettings, flashcardCountSlider, 
        flashcardCountValue, quizCountSlider, quizCountValue
    ];
    
    const missingElements = requiredElements.filter(el => !el);
    if (missingElements.length > 0) {
        console.error('Some DOM elements are missing:', missingElements);
        return;
    }
    
    // Initialize button states
    updateGenerateButtonStates();
    
    // Initialize settings
    initializeSettings();
    
    // Listen for text changes to reset validation state
    inputText.addEventListener('input', function() {
        isTextSchoolRelated = false;
        updateGenerateButtonStates();
        // Hide previous check status
        checkStatus.classList.add('hidden');
        // Hide any existing study materials
        flashcardsContainer.classList.add('hidden');
        quizContainer.classList.add('hidden');
        quizResult.classList.add('hidden');
    });
    
    // Check if text is school-related
    checkTextBtn.addEventListener('click', async function() {
        console.log('Check text button clicked');
        const text = inputText.value.trim();
        if (!text) {
            showStatus(checkStatus, 'Please enter some text first!', 'error');
            return;
        }
        
        showStatus(checkStatus, 'Checking text...', 'info');
        
        try {
            const response = await fetch(`${backendUrl}/check_text`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'ngrok-skip-browser-warning': 'true'
                },
                body: JSON.stringify({ text: text })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            isTextSchoolRelated = data.school_related;
            
            const message = isTextSchoolRelated
                ? '✅ This text appears to be school-related! You can now generate study materials.' 
                : '❌ This text doesn\'t appear to be school-related. Please enter educational content to generate study materials.';
            showStatus(checkStatus, message, isTextSchoolRelated ? 'success' : 'error');
            
            updateGenerateButtonStates();
            
        } catch (error) {
            console.error('Error checking text:', error);
            showStatus(checkStatus, `Error: ${error.message}`, 'error');
            isTextSchoolRelated = false;
            updateGenerateButtonStates();
        }
    });
    
    // Generate flashcards
    generateFlashcardsBtn.addEventListener('click', async function() {
        if (!isTextSchoolRelated) {
            showStatus(generateStatus, 'Please verify that your text is school-related first!', 'error');
            return;
        }
        
        console.log('Generate flashcards button clicked');
        const text = inputText.value.trim();
        
        showStatus(generateStatus, 'Generating flashcards...', 'info');
        flashcardsContainer.classList.add('hidden');
        quizContainer.classList.add('hidden');
        quizResult.classList.add('hidden');
        
        try {
            const response = await fetch(`${backendUrl}/flashcards`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'ngrok-skip-browser-warning': 'true'
                },
                body: JSON.stringify({ text: text, count: flashcardCount })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            flashcards = data.flashcards || [];
            
            if (flashcards.length === 0) {
                showStatus(generateStatus, 'No flashcards were generated. Please try with different text.', 'error');
                return;
            }
            
            displayFlashcards();
            showStatus(generateStatus, `${flashcards.length} flashcards generated successfully!`, 'success');
            
        } catch (error) {
            console.error('Error generating flashcards:', error);
            showStatus(generateStatus, `Error: ${error.message}`, 'error');
        }
    });
    
    // Generate quiz
    generateQuizBtn.addEventListener('click', async function() {
        if (!isTextSchoolRelated) {
            showStatus(generateStatus, 'Please verify that your text is school-related first!', 'error');
            return;
        }
        
        console.log('Generate quiz button clicked');
        const text = inputText.value.trim();
        
        showStatus(generateStatus, 'Generating quiz...', 'info');
        flashcardsContainer.classList.add('hidden');
        quizContainer.classList.add('hidden');
        quizResult.classList.add('hidden');
        
        try {
            const response = await fetch(`${backendUrl}/quiz`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'ngrok-skip-browser-warning': 'true'
                },
                body: JSON.stringify({ text: text, count: quizCount })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            quizQuestions = data.quiz || [];
            
            if (quizQuestions.length === 0) {
                showStatus(generateStatus, 'No quiz questions were generated. Please try with different text.', 'error');
                return;
            }
            
            currentQuestionIndex = 0;
            userScore = 0;
            displayQuizQuestion();
            quizContainer.classList.remove('hidden');
            showStatus(generateStatus, `Quiz with ${quizQuestions.length} questions generated successfully!`, 'success');
            
        } catch (error) {
            console.error('Error generating quiz:', error);
            showStatus(generateStatus, `Error: ${error.message}`, 'error');
        }
    });
    
    // Flashcard navigation
    prevCardBtn.addEventListener('click', () => navigateCards(-1));
    nextCardBtn.addEventListener('click', () => navigateCards(1));
    
    // Quiz navigation
    prevQuestionBtn.addEventListener('click', () => navigateQuestions(-1));
    nextQuestionBtn.addEventListener('click', () => navigateQuestions(1));
    restartQuizBtn.addEventListener('click', restartQuiz);
    
    // Settings event listeners
    settingsBtn.addEventListener('click', openSettings);
    closeSettings.addEventListener('click', closeSettingsModal);
    flashcardCountSlider.addEventListener('input', updateFlashcardCount);
    quizCountSlider.addEventListener('input', updateQuizCount);
    
    // Close modal when clicking outside
    settingsModal.addEventListener('click', function(e) {
        if (e.target === settingsModal) {
            closeSettingsModal();
        }
    });
    
    function updateGenerateButtonStates() {
        const hasText = inputText.value.trim().length > 0;
        
        if (!hasText || !isTextSchoolRelated) {
            generateFlashcardsBtn.disabled = true;
            generateQuizBtn.disabled = true;
            
            if (!hasText) {
                generateFlashcardsBtn.title = 'Enter text first';
                generateQuizBtn.title = 'Enter text first';
            } else if (!isTextSchoolRelated) {
                generateFlashcardsBtn.title = 'Verify text is school-related first';
                generateQuizBtn.title = 'Verify text is school-related first';
            }
        } else {
            generateFlashcardsBtn.disabled = false;
            generateQuizBtn.disabled = false;
            generateFlashcardsBtn.title = '';
            generateQuizBtn.title = '';
        }
    }
    
    function displayFlashcards() {
        flashcardsList.innerHTML = '';
        currentCardIndex = 0;
        
        if (flashcards.length === 0) return;
        
        flashcards.forEach((card, index) => {
            const cardElement = document.createElement('div');
            cardElement.className = 'flashcard hidden';
            cardElement.innerHTML = `
                <div class="flashcard-inner">
                    <div class="flashcard-front">
                        <div class="flashcard-content">${escapeHtml(card.Q)}</div>
                        <div class="flashcard-hint">Click to flip</div>
                    </div>
                    <div class="flashcard-back">
                        <div class="flashcard-content">${escapeHtml(card.A)}</div>
                        <div class="flashcard-hint">Click to flip</div>
                    </div>
                </div>
            `;
            
            cardElement.addEventListener('click', function() {
                this.classList.toggle('flipped');
            });
            
            flashcardsList.appendChild(cardElement);
        });
        
        // Show first card
        flashcardsList.children[0].classList.remove('hidden');
        updateCardNavigation();
        
        flashcardsContainer.classList.remove('hidden');
    }
    
    function navigateCards(direction) {
        // Hide current card
        flashcardsList.children[currentCardIndex].classList.add('hidden');
        
        // Update index
        currentCardIndex += direction;
        
        // Show new card
        flashcardsList.children[currentCardIndex].classList.remove('hidden');
        
        updateCardNavigation();
    }
    
    function updateCardNavigation() {
        cardCounter.textContent = `${currentCardIndex + 1}/${flashcards.length}`;
        prevCardBtn.disabled = currentCardIndex === 0;
        nextCardBtn.disabled = currentCardIndex === flashcards.length - 1;
    }
    
    function displayQuizQuestion() {
        const question = quizQuestions[currentQuestionIndex];
        currentQuestion.textContent = question.question;
        
        quizOptions.innerHTML = '';
        question.options.forEach((option, index) => {
            const optionElement = document.createElement('div');
            optionElement.className = 'quiz-option';
            optionElement.textContent = option;
            optionElement.dataset.option = option;
            
            // Check if this option was previously selected
            if (question.userAnswer === option) {
                optionElement.classList.add('selected');
                selectedOption = option;
            }
            
            optionElement.addEventListener('click', function() {
                // Deselect previous selection
                document.querySelectorAll('.quiz-option').forEach(opt => {
                    opt.classList.remove('selected');
                });
                
                // Select this option
                this.classList.add('selected');
                selectedOption = option;
                
                // Store the answer for this question
                question.userAnswer = option;
            });
            
            quizOptions.appendChild(optionElement);
        });
        
        // Reset feedback
        answerFeedback.classList.add('hidden');
        selectedOption = null;
        
        // Update progress
        progressText.textContent = `Question ${currentQuestionIndex + 1} of ${quizQuestions.length}`;
        
        // Update progress bar
        const progressBar = document.querySelector('.progress-fill');
        if (progressBar) {
            progressBar.style.width = `${((currentQuestionIndex + 1) / quizQuestions.length) * 100}%`;
        }
        
        // Update navigation buttons
        prevQuestionBtn.disabled = currentQuestionIndex === 0;
        // Don't disable the next button on the last question since it becomes the "Finish" button
        
        // Reset quiz option states
        document.querySelectorAll('.quiz-option').forEach(opt => {
            opt.style.pointerEvents = 'auto';
            opt.classList.remove('correct', 'incorrect');
        });
        
        // If it's the last question, change next button to "Finish"
        if (currentQuestionIndex === quizQuestions.length - 1) {
            nextQuestionBtn.textContent = 'Finish';
            if (nextQuestionBtn.querySelector('.material-icons')) {
                nextQuestionBtn.innerHTML = 'Finish<span class="material-icons">check_circle</span>';
            }
        } else {
            nextQuestionBtn.textContent = 'Next';
            if (nextQuestionBtn.querySelector('.material-icons')) {
                nextQuestionBtn.innerHTML = 'Next<span class="material-icons">arrow_forward</span>';
            }
        }
    }
    
    function navigateQuestions(direction) {
        if (direction === 1 && currentQuestionIndex === quizQuestions.length - 1) {
            // Finish quiz
            finishQuiz();
            return;
        }
        
        currentQuestionIndex += direction;
        displayQuizQuestion();
    }
    

    
    function finishQuiz() {
        // Calculate score based on stored answers
        userScore = 0;
        quizQuestions.forEach(question => {
            if (question.userAnswer === question.answer) {
                userScore++;
            }
        });
        
        const finalScoreValue = Math.round((userScore / quizQuestions.length) * 100);
        finalScore.textContent = `${userScore}/${quizQuestions.length} (${finalScoreValue}%)`;
        
        // Set message based on score
        if (finalScoreValue >= 80) {
            resultMessage.textContent = 'Excellent! You have mastered this material!';
        } else if (finalScoreValue >= 60) {
            resultMessage.textContent = 'Good job! You have a good understanding.';
        } else {
            resultMessage.textContent = 'Keep studying! You\'ll do better next time.';
        }
        
        quizContainer.classList.add('hidden');
        quizResult.classList.remove('hidden');
    }
    
    function restartQuiz() {
        currentQuestionIndex = 0;
        userScore = 0;
        // Clear stored answers
        quizQuestions.forEach(question => {
            delete question.userAnswer;
        });
        displayQuizQuestion();
        quizResult.classList.add('hidden');
        quizContainer.classList.remove('hidden');
    }
    
    function showStatus(element, message, type) {
        element.textContent = message;
        element.className = `status ${type}`;
        element.classList.remove('hidden');
        
        // Hide success/info messages after 3 seconds
        if (type === 'success' || type === 'info') {
            setTimeout(() => {
                element.classList.add('hidden');
            }, 3000);
        }
    }
    
    // Utility function to escape HTML to prevent XSS
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    // Settings functions
    function initializeSettings() {
        // Load saved settings from localStorage
        const savedFlashcardCount = localStorage.getItem('flashcardCount');
        const savedQuizCount = localStorage.getItem('quizCount');
        
        if (savedFlashcardCount) {
            flashcardCount = parseInt(savedFlashcardCount);
            flashcardCountSlider.value = flashcardCount;
            flashcardCountValue.textContent = flashcardCount;
        }
        
        if (savedQuizCount) {
            quizCount = parseInt(savedQuizCount);
            quizCountSlider.value = quizCount;
            quizCountValue.textContent = quizCount;
        }
    }
    
    function openSettings() {
        settingsModal.classList.remove('hidden');
    }
    
    function closeSettingsModal() {
        settingsModal.classList.add('hidden');
    }
    
    function updateFlashcardCount() {
        flashcardCount = parseInt(flashcardCountSlider.value);
        flashcardCountValue.textContent = flashcardCount;
        localStorage.setItem('flashcardCount', flashcardCount);
    }
    
    function updateQuizCount() {
        quizCount = parseInt(quizCountSlider.value);
        quizCountValue.textContent = quizCount;
        localStorage.setItem('quizCount', quizCount);
    }
    function pingServer() {
        fetch(`${backendUrl}/ping`, { method: 'GET' })
            .then(response => console.log('Pinged server:', response.status))
            .catch(error => console.error('Ping error:', error));
    }
    
    // Start pinging every 30 seconds
    setInterval(pingServer, 30000);
    
    // Optionally, ping immediately on load
    pingServer();
});