from google.protobuf.internal import enum_type_wrapper as _enum_type_wrapper
from google.protobuf import descriptor as _descriptor
from google.protobuf import message as _message
from typing import ClassVar as _ClassVar, Optional as _Optional, Union as _Union

DESCRIPTOR: _descriptor.FileDescriptor

class Status(int, metaclass=_enum_type_wrapper.EnumTypeWrapper):
    __slots__ = ()
    INFO: _ClassVar[Status]
    WARN: _ClassVar[Status]
    ERROR: _ClassVar[Status]
    SUCCESS: _ClassVar[Status]
    FAILURE: _ClassVar[Status]
    UNKNOWN: _ClassVar[Status]
    VERDICT: _ClassVar[Status]
    FINAL_VERDICT: _ClassVar[Status]
INFO: Status
WARN: Status
ERROR: Status
SUCCESS: Status
FAILURE: Status
UNKNOWN: Status
VERDICT: Status
FINAL_VERDICT: Status

class ProcessRequest(_message.Message):
    __slots__ = ("status", "message")
    STATUS_FIELD_NUMBER: _ClassVar[int]
    MESSAGE_FIELD_NUMBER: _ClassVar[int]
    status: Status
    message: str
    def __init__(self, status: _Optional[_Union[Status, str]] = ..., message: _Optional[str] = ...) -> None: ...

class ProcessResponse(_message.Message):
    __slots__ = ()
    def __init__(self) -> None: ...
