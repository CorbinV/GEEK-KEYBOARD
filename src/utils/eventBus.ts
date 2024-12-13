import mitt from 'mitt';

type Events = {
  resetKey: string;
};

const emitter = mitt<Events>();

export default emitter;
