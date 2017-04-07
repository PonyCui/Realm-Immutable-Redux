
export const TEST_UDPATE_USER = "TEST_UDPATE_USER";

export const updateUser = function (userEntity) {
    return {
        type: TEST_UDPATE_USER,
        payload: {
            userEntity,
        }
    }
}