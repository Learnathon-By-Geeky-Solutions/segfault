import os
import pytest
import requests
from unittest.mock import patch, MagicMock

from email_consumer import EmailConsumer


@pytest.fixture
def email_consumer():
    return EmailConsumer()


@patch("requests.post")
def test_send_verification_email_success(mock_post, email_consumer):
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_post.return_value = mock_response

    response = email_consumer.send_verification_email(
        email="test@example.com",
        verification_code="123456",
        username="testuser",
        user_id="user123",
    )

    assert response is not None
    assert response.status_code == 200
    mock_post.assert_called_once_with(
        "https://api.mailgun.net/v3/mail.codesirius.tech/messages",
        auth=("api", os.environ.get("MAILGUN_API_KEY")),
        data={
            "from": f"Codesirius <no-reply@{os.environ.get('MAILGUN_DOMAIN')}>",
            "to": "test@example.com",
            "subject": "Verify Codesirius Account",
            "html": requests.post.call_args[1]["data"]["html"],
        },
    )


@patch("requests.post")
def test_send_verification_email_failure(mock_post, email_consumer):
    mock_response = MagicMock()
    mock_response.status_code = 400
    mock_post.return_value = mock_response

    response = email_consumer.send_verification_email(
        email="test@example.com",
        verification_code="123456",
        username="testuser",
        user_id="user123",
    )

    assert response is not None
    assert response.status_code == 400
    mock_post.assert_called_once()


@patch("requests.post", side_effect=Exception("Network Error"))
def test_send_verification_email_exception(mock_post, email_consumer):
    response = email_consumer.send_verification_email(
        email="test@example.com",
        verification_code="123456",
        username="testuser",
        user_id="user123",
    )

    assert response is None
    mock_post.assert_called_once()


@patch.object(EmailConsumer, "send_verification_email")
def test_process_message_success(mock_send_email, email_consumer):
    mock_send_email.return_value = MagicMock(status_code=200)
    message = {
        "email": "test@example.com",
        "verification_code": "123456",
        "username": "testuser",
        "user_id": "user123",
    }

    email_consumer.process_message(message)
    mock_send_email.assert_called_once_with(**message)


@patch.object(EmailConsumer, "send_verification_email")
def test_process_message_failure(mock_send_email, email_consumer):
    mock_send_email.return_value = MagicMock(status_code=400)
    message = {
        "email": "test@example.com",
        "verification_code": "123456",
        "username": "testuser",
        "user_id": "user123",
    }

    email_consumer.process_message(message)
    mock_send_email.assert_called_once_with(**message)
