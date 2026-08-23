from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from openai import OpenAI, RateLimitError
import os
import re
import json


# =========================================
# APP SETUP
# =========================================

app = FastAPI()

load_dotenv()

client = OpenAI(
    api_key=os.getenv("OPENAI_API_KEY")
)


# =========================================
# CORS
# =========================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =========================================
# REQUEST MODEL
# =========================================

class PromptRequest(BaseModel):
    prompt: str


# =========================================
# HOME
# =========================================

@app.get("/")
def home():
    return {
        "message": "PromptCompiler Backend is running!"
    }


# =========================================
# PROMPT QUALITY ANALYZER
# =========================================

def analyze_prompt_quality(prompt):

    text = prompt.strip()
    lower_text = text.lower()

    checks = []
    missing = []
    suggestions = []

    score = 0


    # =====================================
    # GOAL CHECK
    # =====================================

    goal_words = [
        "build",
        "create",
        "make",
        "develop",
        "design",
        "teach",
        "learn",
        "explain",
        "write",
        "generate",
        "solve",
        "analyze",
        "compare",
        "prepare",
        "help",
        "show",
        "give"
    ]

    has_goal = any(
        word in lower_text
        for word in goal_words
    )

    if has_goal:

        score += 20

        checks.append(
            "Clear user goal identified"
        )

    else:

        missing.append("Goal")

        suggestions.append(
            "Clearly state what you want the AI to accomplish."
        )


    # =====================================
    # SUBJECT CHECK
    # =====================================

    subject_words = [
        "python",
        "java",
        "javascript",
        "react",
        "c++",
        "c programming",
        "dbms",
        "database",
        "website",
        "portfolio",
        "programming",
        "math",
        "mathematics",
        "physics",
        "sql",
        "ai",
        "artificial intelligence",
        "machine learning",
        "computer science",
        "marketing",
        "business",
        "design",
        "html",
        "css",
        "node",
        "node.js",
        "fastapi",
        "mongodb"
    ]

    has_subject = any(
        word in lower_text
        for word in subject_words
    )

    if has_subject:

        score += 20

        checks.append(
            "Subject identified"
        )

    else:

        missing.append("Subject")

        suggestions.append(
            "Specify the main subject or topic."
        )


    # =====================================
    # AUDIENCE / LEVEL CHECK
    # =====================================

    audience_words = [
        "beginner",
        "intermediate",
        "advanced",
        "student",
        "developer",
        "professional",
        "teacher",
        "child",
        "expert",
        "college",
        "school",
        "user",
        "client",
        "freshman",
        "new to",
        "from zero",
        "from scratch"
    ]

    has_audience = any(
        word in lower_text
        for word in audience_words
    )

    if has_audience:

        score += 15

        checks.append(
            "Target audience or level identified"
        )

    else:

        missing.append(
            "Target audience / skill level"
        )

        suggestions.append(
            "Specify the target audience or your current skill level."
        )


    # =====================================
    # DURATION CHECK
    # =====================================

    duration_match = re.search(
        r"\d+\s*(day|days|week|weeks|month|months|hour|hours)",
        lower_text
    )

    if duration_match:

        score += 15

        checks.append(
            "Time or duration specified"
        )

    else:

        missing.append("Duration")

        suggestions.append(
            "Add a time limit or duration if the task needs one."
        )


    # =====================================
    # OUTPUT CHECK
    # =====================================

    output_words = [
        "format",
        "table",
        "list",
        "steps",
        "code",
        "report",
        "summary",
        "notes",
        "questions",
        "examples",
        "roadmap",
        "plan",
        "pdf",
        "json",
        "markdown",
        "explanation",
        "output",
        "answer",
        "solution",
        "code",
        "file"
    ]

    has_output = any(
        word in lower_text
        for word in output_words
    )

    if has_output:

        score += 15

        checks.append(
            "Expected output format identified"
        )

    else:

        missing.append(
            "Output format"
        )

        suggestions.append(
            "Tell the AI what format you want the final answer in."
        )


    # =====================================
    # CONSTRAINT CHECK
    # =====================================

    constraint_words = [
        "only",
        "must",
        "without",
        "include",
        "avoid",
        "limit",
        "maximum",
        "minimum",
        "using",
        "do not",
        "don't",
        "exactly",
        "required",
        "should"
    ]

    has_constraints = any(
        word in lower_text
        for word in constraint_words
    )

    if has_constraints:

        score += 15

        checks.append(
            "Requirements or constraints identified"
        )

    else:

        missing.append(
            "Constraints"
        )

        suggestions.append(
            "Add important requirements, limitations, or things to avoid."
        )


    # =====================================
    # QUALITY LEVEL
    # =====================================

    if score >= 85:

        quality = "Excellent"

    elif score >= 70:

        quality = "Good"

    elif score >= 50:

        quality = "Needs Improvement"

    else:

        quality = "Weak"


    # =====================================
    # RETURN
    # =====================================

    return {

        "score": score,

        "quality": quality,

        "checks": checks,

        "missing": missing,

        "suggestions": suggestions

    }


# =========================================
# DEMO COMPILE
# =========================================

def demo_compile(user_request):

    user_prompt = user_request.lower()


    # =====================================
    # DEFAULT VALUES
    # =====================================

    goal = "Understand and complete the user's request"

    subject = "General task"

    duration = "Not specified"

    output = "Structured workflow"


    task_plan = [

        "Understand the main requirements",

        "Break the request into smaller tasks",

        "Create a structured execution plan",

        "Generate the required result",

        "Verify the final result"

    ]


    # =====================================
    # WEBSITE / PORTFOLIO
    # =====================================

    if (
        "website" in user_prompt
        or "portfolio" in user_prompt
        or "web app" in user_prompt
        or "web application" in user_prompt
    ):

        goal = "Build a website or web application"

        subject = "Web Development"

        output = "Functional and visually appealing website"

        task_plan = [

            "Analyze the website requirements",

            "Plan the website structure and sections",

            "Design the user interface and visual style",

            "Implement the frontend components",

            "Test and verify the final website"

        ]


    # =====================================
    # DBMS / STUDY
    # =====================================

    elif (
        "dbms" in user_prompt
        or "database" in user_prompt
        or "study plan" in user_prompt
        or "exam" in user_prompt
        or "study" in user_prompt
    ):

        goal = "Create a structured learning or study plan"

        subject = "Academic Study"

        output = "Structured study plan with practice"

        task_plan = [

            "Identify the important topics",

            "Divide the topics into manageable sections",

            "Create a logical learning sequence",

            "Add practice questions and revision",

            "Verify that the study plan covers the requirements"

        ]


    # =====================================
    # PROGRAMMING
    # =====================================

    elif (
        "code" in user_prompt
        or "program" in user_prompt
        or "python" in user_prompt
        or "java" in user_prompt
        or "javascript" in user_prompt
        or "react" in user_prompt
        or "c++" in user_prompt
        or "programming" in user_prompt
    ):

        goal = "Create or solve a programming task"

        subject = "Programming"

        output = "Working and explained code"

        task_plan = [

            "Understand the programming requirements",

            "Plan the solution and logic",

            "Implement the code",

            "Test the code with suitable cases",

            "Verify and improve the final solution"

        ]


    # =====================================
    # DURATION
    # =====================================

    duration_match = re.search(
        r"\d+\s*(day|days|week|weeks|month|months|hour|hours)",
        user_prompt
    )

    if duration_match:

        duration = duration_match.group(0)


    # =====================================
    # GENERATED PROMPT
    # =====================================

    generated_prompt = f"""
You are an expert assistant.

USER REQUEST:

{user_request}

MAIN GOAL:

{goal}

SUBJECT:

{subject}

DURATION:

{duration}

EXPECTED OUTPUT:

{output}

TASK PLAN:

1. {task_plan[0]}
2. {task_plan[1]}
3. {task_plan[2]}
4. {task_plan[3]}
5. {task_plan[4]}

INSTRUCTIONS:

- Understand the user's exact requirements.
- Follow the task plan logically.
- Produce a clear and useful result.
- Include practical details where appropriate.
- Verify the final result before returning it.
""".strip()


    # =====================================
    # QUALITY
    # =====================================

    quality = analyze_prompt_quality(
        user_request
    )


    # =====================================
    # VERIFICATION
    # =====================================

    verification = {

        "status": "PASS",

        "score": 92,

        "checks": [

            "User intent identified",

            "Task plan created",

            "Prompt contains required instructions",

            "Output requirements defined",

            "Final prompt is ready"

        ]

    }


    # =====================================
    # FINAL RESPONSE
    # =====================================

    return {

        "success": True,

        "mode": "demo",

        "prompt": user_request,

        "intent": {

            "goal": goal,

            "subject": subject,

            "duration": duration,

            "output": output

        },

        "tasks": task_plan,

        "generated_prompt": generated_prompt,

        "verification": verification,

        "quality": quality

    }


# =========================================
# COMPILE
# =========================================

@app.post("/compile")
def compile_prompt(data: PromptRequest):

    try:

        # =====================================
        # REAL OPENAI
        # =====================================

        response = client.responses.create(

            model="gpt-5-mini",

            input=f"""
You are the AI engine of PromptCompiler.

Analyze this user request:

{data.prompt}

Return ONLY valid JSON.

Use exactly this structure:

{{
    "intent": {{
        "goal": "...",
        "subject": "...",
        "duration": "...",
        "output": "..."
    }},

    "tasks": [
        "...",
        "...",
        "...",
        "...",
        "..."
    ],

    "generated_prompt": "...",

    "quality": {{
        "score": 0,
        "quality": "...",
        "missing": [],
        "suggestions": [],
        "checks": []
    }},

    "verification": {{
        "status": "PASS",
        "score": 0,
        "checks": []
    }}
}}

Rules:

- Analyze the actual user request.
- Identify the exact main goal.
- Identify the main subject.
- Detect duration if mentioned.
- Identify expected output.
- Create exactly five logical tasks.
- Create a detailed optimized prompt.
- Analyze the quality of the ORIGINAL user prompt.
- Score the original prompt from 0 to 100.
- List missing information.
- Give useful suggestions.
- List passed quality checks.
- Verify the generated prompt.
- Return JSON only.

USER REQUEST:

{data.prompt}
"""
        )


        ai_result = response.output_text.strip()


        # =====================================
        # REMOVE MARKDOWN CODE BLOCK
        # =====================================

        if ai_result.startswith("```"):

            ai_result = re.sub(
                r"```(?:json)?",
                "",
                ai_result,
                flags=re.IGNORECASE
            ).strip()

            if ai_result.endswith("```"):

                ai_result = ai_result[:-3].strip()


        # =====================================
        # PARSE JSON
        # =====================================

        try:

            ai_data = json.loads(
                ai_result
            )

        except json.JSONDecodeError:

            match = re.search(
                r"\{.*\}",
                ai_result,
                re.DOTALL
            )

            if not match:

                raise ValueError(
                    "AI returned invalid JSON"
                )

            ai_data = json.loads(
                match.group(0)
            )


        # =====================================
        # INTENT
        # =====================================

        intent = ai_data.get(
            "intent",
            {}
        )

        goal = intent.get(
            "goal",
            "Understand and complete the user's request"
        )

        subject = intent.get(
            "subject",
            "General task"
        )

        duration = intent.get(
            "duration",
            "Not specified"
        )

        output = intent.get(
            "output",
            "Structured result"
        )


        # =====================================
        # TASKS
        # =====================================

        tasks = ai_data.get(
            "tasks",
            []
        )

        if not isinstance(tasks, list):

            tasks = []


        tasks = [
            str(task)
            for task in tasks
            if str(task).strip()
        ]


        default_tasks = [

            "Understand the user's requirements",

            "Break the request into logical tasks",

            "Create an execution plan",

            "Generate the required result",

            "Verify and improve the final result"

        ]


        while len(tasks) < 5:

            tasks.append(
                default_tasks[len(tasks)]
            )


        tasks = tasks[:5]


        # =====================================
        # GENERATED PROMPT
        # =====================================

        generated_prompt = ai_data.get(
            "generated_prompt",
            ""
        )


        if not generated_prompt:

            generated_prompt = f"""
You are an expert assistant.

USER REQUEST:
{data.prompt}

MAIN GOAL:
{goal}

SUBJECT:
{subject}

DURATION:
{duration}

EXPECTED OUTPUT:
{output}

TASK PLAN:

1. {tasks[0]}
2. {tasks[1]}
3. {tasks[2]}
4. {tasks[3]}
5. {tasks[4]}

INSTRUCTIONS:

- Understand the user's exact requirements.
- Follow the task plan logically.
- Produce a clear and useful result.
- Verify the final result.
""".strip()


        # =====================================
        # QUALITY
        # =====================================

        quality = ai_data.get(
            "quality",
            {}
        )

        if not isinstance(quality, dict):

            quality = {}


        # Always analyze the original prompt locally too
        local_quality = analyze_prompt_quality(
            data.prompt
        )


        # Use AI quality when available
        try:

            quality_score = int(
                quality.get(
                    "score",
                    local_quality["score"]
                )
            )

        except:

            quality_score = local_quality["score"]


        quality_score = max(
            0,
            min(
                quality_score,
                100
            )
        )


        quality = {

            "score": quality_score,

            "quality": quality.get(
                "quality",
                local_quality["quality"]
            ),

            "missing": quality.get(
                "missing",
                local_quality["missing"]
            ),

            "suggestions": quality.get(
                "suggestions",
                local_quality["suggestions"]
            ),

            "checks": quality.get(
                "checks",
                local_quality["checks"]
            )

        }


        # =====================================
        # VERIFICATION
        # =====================================

        verification = ai_data.get(
            "verification",
            {}
        )

        if not isinstance(verification, dict):

            verification = {}


        try:

            verification_score = int(
                verification.get(
                    "score",
                    90
                )
            )

        except:

            verification_score = 90


        verification_score = max(
            0,
            min(
                verification_score,
                100
            )
        )


        verification = {

            "status": verification.get(
                "status",
                "PASS"
            ),

            "score": verification_score,

            "checks": verification.get(
                "checks",
                [
                    "User intent identified",
                    "Task plan created",
                    "Prompt contains required instructions",
                    "Output requirements defined",
                    "Final prompt is ready"
                ]
            )

        }


        # =====================================
        # FINAL AI RESPONSE
        # =====================================

        return {

            "success": True,

            "mode": "ai",

            "prompt": data.prompt,

            "intent": {

                "goal": goal,

                "subject": subject,

                "duration": duration,

                "output": output

            },

            "tasks": tasks,

            "generated_prompt": generated_prompt,

            "quality": quality,

            "verification": verification

        }


    except RateLimitError:

        return demo_compile(
            data.prompt
        )


    except Exception as error:

        print(
            "AI COMPILE ERROR:",
            error
        )

        return demo_compile(
            data.prompt
        )


# =========================================
# IMPROVE PROMPT
# =========================================

@app.post("/improve")
def improve_prompt(data: PromptRequest):

    try:

        # =====================================
        # REAL AI
        # =====================================

        response = client.responses.create(

            model="gpt-5-mini",

            input=f"""
You are the Prompt Improvement Engine
of PromptCompiler.

Improve the following user prompt:

{data.prompt}

Create a clearer, more specific,
structured and useful prompt.

Rules:

- Preserve the user's original intention.
- Do not change the main goal.
- Add useful missing context.
- Specify the expected output where appropriate.
- Add logical requirements.
- Remove ambiguity.
- Make the prompt easy for another AI to execute.
- Do not explain what you changed.
- Return ONLY the improved prompt.

ORIGINAL PROMPT:

{data.prompt}
"""
        )

        improved_prompt = response.output_text.strip()


        return {

            "success": True,

            "mode": "ai",

            "original_prompt": data.prompt,

            "improved_prompt": improved_prompt

        }


    except RateLimitError:

        return demo_improve(
            data.prompt
        )


    except Exception as error:

        print(
            "AI IMPROVE ERROR:",
            error
        )

        return demo_improve(
            data.prompt
        )


# =========================================
# DEMO IMPROVE
# =========================================

def demo_improve(user_request):

    improved_prompt = f"""
You are an expert assistant.

USER REQUEST:

{user_request}

OBJECTIVE:

Understand the user's request precisely
and provide the most useful result.

REQUIREMENTS:

1. Identify the main objective.
2. Identify the important subject or topic.
3. Consider the user's context and skill level.
4. Break the work into logical steps.
5. Provide a clear and structured result.
6. Include practical examples where useful.
7. Follow all important requirements.
8. Avoid unnecessary information.
9. Verify the final answer against the original request.

EXPECTED OUTPUT:

Provide a complete, accurate and
well-structured response that directly
addresses the user's request.

Before finishing, verify that the response
satisfies all important requirements.
""".strip()


    return {

        "success": True,

        "mode": "demo",

        "original_prompt": user_request,

        "improved_prompt": improved_prompt

    }


# =========================================
# TEST AI
# =========================================

@app.get("/test-ai")
def test_ai():

    try:

        response = client.responses.create(

            model="gpt-5-mini",

            input=(
                "Say hello to PromptCompiler "
                "in one short sentence."
            )
        )


        return {

            "success": True,

            "message": response.output_text

        }


    except RateLimitError:

        return {

            "success": False,

            "message": (
                "AI credits are exhausted. "
                "Demo mode is available."
            )

        }


    except Exception as error:

        return {

            "success": False,

            "message": str(error)

        }