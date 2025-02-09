from rest_framework.exceptions import NotFound

from authentication.models import VerificationCode


def get_verification_code(user_id):
    """
    Helper function to get the verification code for a user.

    Args:
        user_id (int): The user ID for the user.

    Returns:
        VerificationCode: The verification code for the user.
        User: The user object.

    Raises:
        NotFound: If the verification code or user is not
            found.
    """
    # Fetch the verification code for the user
    verification_code = VerificationCode.objects.filter(user_id=user_id).first()

    # Check if verification code exists
    if not verification_code:
        raise NotFound("Requested resource was not found")

    # Check if user is already active
    user = verification_code.user
    if user.is_active:
        raise NotFound("Requested resource was not found")

    return verification_code, user
