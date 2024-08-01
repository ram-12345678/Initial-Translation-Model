const ReduxThunk= ({ dispatch }) =>
    (next) =>
    (action) => {
      // check if there is payload in  action. if not send it to the next middleware
      if (!action?.payload || !action?.payload?.then) {
        return next.action;
      }
      // if we are here means we have action.payload. now check if it is promise
      // wait for the promise to be resolved
      action.payload.then(function (response) {
        // overwrite the action
        const newAction = { ...action, payload: response };
        dispatch(newAction);
      });
    };
    export default ReduxThunk