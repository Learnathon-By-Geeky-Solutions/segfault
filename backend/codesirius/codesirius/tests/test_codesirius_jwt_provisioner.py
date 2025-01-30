import unittest

from codesirius.utils.jwt.jwt_provisioner import CodesiriusJWTProvisioner


class CodesiriusJWTProvisionerTestCase(unittest.TestCase):
    def setUp(self):
        self.jwt_secret = "secret"
        self.jwt_algorithm = "HS256"

    def test_provision_jwt(self):
        jwt_provisioner = CodesiriusJWTProvisioner(
            jwt_secret=self.jwt_secret, jwt_algorithm=self.jwt_algorithm
        )
        token = jwt_provisioner.provision_jwt(
            token_type="access", expiration_minutes=15, user_id=1
        )
        self.assertTrue(token)

    def test_verify_jwt(self):
        jwt_provisioner = CodesiriusJWTProvisioner(
            jwt_secret=self.jwt_secret, jwt_algorithm=self.jwt_algorithm
        )
        token = jwt_provisioner.provision_jwt(
            token_type="access", expiration_minutes=15, user_id=1
        )
        self.assertTrue(jwt_provisioner.verify_jwt(token))

    def test_extract_payload(self):
        jwt_provisioner = CodesiriusJWTProvisioner(
            jwt_secret=self.jwt_secret, jwt_algorithm=self.jwt_algorithm
        )
        payload = {"user_id": 1}
        token = jwt_provisioner.provision_jwt(
            token_type="access", expiration_minutes=15, **payload
        )
        decoded = jwt_provisioner.extract_payload(token)
        self.assertEqual(decoded["user_id"], payload["user_id"])

    def test_extract_payload_invalid_token(self):
        jwt_provisioner = CodesiriusJWTProvisioner(
            jwt_secret=self.jwt_secret, jwt_algorithm=self.jwt_algorithm
        )
        decoded = jwt_provisioner.extract_payload("invalid_token")
        self.assertIsNone(decoded)

    def test_verify_jwt_expired(self):
        jwt_provisioner = CodesiriusJWTProvisioner(
            jwt_secret=self.jwt_secret, jwt_algorithm=self.jwt_algorithm
        )
        token = jwt_provisioner.provision_jwt(
            token_type="access", expiration_minutes=0, user_id=1
        )
        self.assertFalse(jwt_provisioner.verify_jwt(token))

    def test_verify_jwt_with_invalid_secret(self):
        jwt_provisioner = CodesiriusJWTProvisioner(
            jwt_secret=self.jwt_secret, jwt_algorithm=self.jwt_algorithm
        )
        token = jwt_provisioner.provision_jwt(
            token_type="access", expiration_minutes=15, user_id=1
        )
        jwt_provisioner.jwt_secret = "invalid_secret"
        self.assertFalse(jwt_provisioner.verify_jwt(token))

    def test_verify_jwt_with_invalid_algorithm(self):
        jwt_provisioner = CodesiriusJWTProvisioner(
            jwt_secret=self.jwt_secret, jwt_algorithm=self.jwt_algorithm
        )
        token = jwt_provisioner.provision_jwt(
            token_type="access", expiration_minutes=15, user_id=1
        )
        jwt_provisioner.jwt_algorithm = "HS512"
        self.assertFalse(jwt_provisioner.verify_jwt(token))


if __name__ == "__main__":
    unittest.main()
