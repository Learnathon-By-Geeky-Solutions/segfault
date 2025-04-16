from rest_framework import serializers
from rest_framework.exceptions import ValidationError

from authentication.utils.get_verification_code import get_verification_code


class CheckVerificationCodeSerializer(serializers.Serializer):
    """
    Serializer for checking the verification code provided by the user.

    This serializer validates the verification code entered by the user against
    the stored verification code for the given user.  It checks for code
    expiration and correctness, and deletes the verification code record
    upon successful validation.
    """
    code = serializers.CharField(
        max_length=6,
        required=True,
        error_messages={"required": "Verification code is required."},
    )

    def validate(self, attrs):
        """
        Validates the provided verification code.

        The validation process includes the following steps:
        1.  Retrieves the verification code and user ID from the serializer's context.
        2.  Fetches the corresponding verification code object and user using
            the `get_verification_code` utility function.
        3.  Checks if the verification code has expired. If expired, raises a
            ValidationError.
        4.  Compares the provided code with the stored code. If they don't match,
            raises a ValidationError.
        5.  If the code is valid, it deletes the verification code record
            from the database.
        6.  Stores the user object in the serializer's context for further use.
        7.  Returns the validated attributes.

        Args:
            attrs (dict): A dictionary containing the data to be validated
                (in this case, the 'code' field).

        Returns:
            dict: The validated data.

        Raises:
            ValidationError: If the verification code is expired or invalid.
        """
        user_id = self.context["user_id"]
        verification_code, user = get_verification_code(user_id)

        # Validate the expiration of the verification code
        if not verification_code.is_valid():
            raise ValidationError({"code": "Verification code is expired."})

        if verification_code.code != attrs["code"]:
            raise ValidationError({"code": "Invalid verification code."})

        # delete the verification code after successful verification
        verification_code.delete()
        self.context["user"] = user
        return attrs
