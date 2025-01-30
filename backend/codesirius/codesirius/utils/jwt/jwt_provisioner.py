import jwt
from datetime import datetime, timedelta

from jwt import PyJWTError


class CodesiriusJWTProvisioner:
    def __init__(self, jwt_secret, jwt_algorithm):
        self.jwt_secret = jwt_secret
        self.jwt_algorithm = jwt_algorithm

    def provision_jwt(self, token_type="access", expiration_minutes=15, **kwargs):
        """
        Provisions a JWT for the given user.
        """
        payload = {
            **kwargs,
            "type": token_type,
            "iat": datetime.now().timestamp(),
            "iss": "codesirius",
            "exp": datetime.now().timestamp()
            + timedelta(minutes=expiration_minutes).seconds,
        }
        return jwt.encode(payload, self.jwt_secret, algorithm=self.jwt_algorithm)

    def verify_jwt(self, token):
        """
        Verifies the given JWT.
        """
        try:
            decoded = jwt.decode(
                token, self.jwt_secret, algorithms=[self.jwt_algorithm]
            )
            return decoded["exp"] >= datetime.now().timestamp()
        except PyJWTError:
            return False

    def extract_payload(self, token):
        """
        Extracts the payload from the given JWT.
        """
        try:
            decoded = jwt.decode(
                token, self.jwt_secret, algorithms=[self.jwt_algorithm]
            )
            return decoded
        except PyJWTError:
            return None
