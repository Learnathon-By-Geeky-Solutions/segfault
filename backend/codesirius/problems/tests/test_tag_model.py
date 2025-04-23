from rest_framework.response import Response
from rest_framework import status

class CodesiriusAPIResponse(Response):
    def __init__(self, data, status_code, message):
        super().__init__(data, status=status_code)
        self.data['message'] = message

def update_tag(self):
    try:
        # operation code
        return CodesiriusAPIResponse(
            data=response.data,  # Return full tag data instead of just ID
            status_code=status.HTTP_200_OK,
            message="Tag updated",
        )
    except Exception as e:
        logger.error(f"Error while... - {e}")
        raise APIException("Error while...") 