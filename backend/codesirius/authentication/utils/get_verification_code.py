from rest_framework.exceptions import NotFound

from authentication.models import VerificationCode


def get_verification_code(user_id):
    """
    Retrieves the verification code and associated inactive user.

    This helper function fetches the latest verification code associated with
    the given user ID. It also retrieves the corresponding user object and
    raises a NotFound exception if either the verification code is not found
    or if the associated user is already active.

    Args:
        user_id (int): The ID of the user for whom to retrieve the
            verification code.

    Returns:
        tuple: A tuple containing:
            - VerificationCode: The verification code object for the user.
            - User: The inactive user object associated with the verification code.

    Raises:
        NotFound: If no verification code is found for the given user ID,
            or if the user associated with the found verification code is
            already marked as active.
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
