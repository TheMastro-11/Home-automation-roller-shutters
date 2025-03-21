import requests
import yaml
import logging
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import (
    Application,
    CommandHandler,
    ConversationHandler,
    CallbackQueryHandler,
    MessageHandler,
    filters,
    ContextTypes,
)

# Enable logging
logging.basicConfig(
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s", level=logging.INFO
)
logger = logging.getLogger(__name__)

# Load configuration from YAML file
with open("Telegram-bot/config.yaml", "r") as config_file:
    config = yaml.safe_load(config_file)

MAIN_API = config["MAIN_API_URL"]
TELEGRAM_BOT_TOKEN = config["TELEGRAM_BOT_TOKEN"]
REGISTER = "/register"
LOGIN = "/authenticate"

# Define conversation states
ASK_USERNAME, ASK_PASSWORD = range(2)

# Function to call the external API for registration
def register_call(username, password):
    data = {"username": username, "password": password}
    try:
        response = requests.post(MAIN_API + REGISTER, json=data)
        response.raise_for_status()  # Raise an error for bad status codes
        return response.json()  # Assuming the API returns JSON data
    except requests.exceptions.RequestException as e:
        logger.error(f"Error calling external API: {e}")
        return None

# Function to call the external API for login
def login_call(username, password):
    data = {"username": username, "password": password}
    try:
        response = requests.post(MAIN_API + LOGIN, json=data)
        response.raise_for_status()  # Raise an error for bad status codes
        return response.json()  # Assuming the API returns JSON data
    except requests.exceptions.RequestException as e:
        logger.error(f"Error calling external API: {e}")
        return None
    

# Function to handle registration
async def register(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    context.user_data["action"] = "register"  # Track that this is a registration
    if isinstance(update, Update):  # Handle direct command calls
        await update.message.reply_text("Please insert a username:")
    else:  # Handle callback queries
        await update.edit_message_text(text="You chose Register. Please insert a username:")
    return ASK_USERNAME

# Function to handle login
async def login(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    context.user_data["action"] = "login"  # Track that this is a login
    if isinstance(update, Update):  # Handle direct command calls
        await update.message.reply_text("Please insert your username:")
    else:  # Handle callback queries
        await update.edit_message_text(text="You chose Login. Please insert your username:")
    return ASK_USERNAME

# Handler to process the username
async def ask_username(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    username = update.message.text
    logger.info(f"Username received: {username}")
    context.user_data["username"] = username  # Store the username
    await update.message.reply_text("Please insert your password:")
    return ASK_PASSWORD  # Move to the next state

# Handler to process the password
async def ask_password(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    password = update.message.text
    logger.info(f"Password received: {password}")
    username = context.user_data["username"]

    # Determine if this is a registration or login attempt
    action = context.user_data.get("action")
    if action == "register":
        data = register_call(username, password)
        action_text = "Registration"
    elif action == "login":
        data = login_call(username, password)
        action_text = "Login"
    else:
        await update.message.reply_text("Invalid action. Please try again.")
        return ConversationHandler.END

    if data:
        await update.message.reply_text(f"{action_text} successful! Response: {data}")
    else:
        await update.message.reply_text(f"Sorry, {action_text.lower()} failed.")

    return ConversationHandler.END  # End the conversation

# Fallback handler to cancel the conversation
async def cancel(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    await update.message.reply_text("Operation canceled.")
    return ConversationHandler.END
