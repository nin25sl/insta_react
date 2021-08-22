// 作成, authSliceの使い回し

//基本はCOunterSlice.tsの中身を変更する形となる。
import { createSlice,createAsyncThunk} from '@reduxjs/toolkit';
import { RootState, } from '../../app/store';
import axios from "axios";
import {PROPS_NEWPOST, PROPS_LIKED, PROPS_COMMENT} from "../types";

const apiUrlPost = `${process.env.REACT_APP_DEV_API_URI}api/post/`
const apiUrlComment = `${process.env.REACT_APP_DEV_API_URI}api/comment/`


//投稿一覧をgetで取得する
export const fetchAsyncGetPosts = createAsyncThunk("post/get", async() => {
    const res = await axios.get(apiUrlPost, {
        headers: {
            Authorization: `JWT ${localStorage.localJWT}`, 
        },
    });
    return res.data;
});

// 新規投稿
export const fetchAsyncNewPost = createAsyncThunk(
    "post/post",
    async (newPost: PROPS_NEWPOST) => {
        // FormDataとは？
        const uploadData = new FormData();
        uploadData.append("title", newPost.title);
        //imgのファイルが存在すれば、uploadDataに追加する
        newPost.img && uploadData.append("img", newPost.img, newPost.img.name);
        const res = await axios.post(apiUrlPost, uploadData, {
                headers : {"Content-Type": "application/json}",
                //localStorageの内容をとる。ログインが成功し、後処理でトークンを格納するため、ここで使用できる。
                Authorization: `JWT ${localStorage.localJWT}`, 
        },
    });
    return res.data;
});

export const fetchAsyncPatchLiked = createAsyncThunk(
    "post/patch",
    async(liked: PROPS_LIKED) => {
        const currentLiked = liked.current;
        const uploadData = new FormData()

        //いいねの管理、いいねがすでに押されているときは、いいねを外す処理をする。
        let isOverlapped = false;

        //新しく追加されるユーザが現在のいいねユーザにある場合、すでにいいねの状態を保持する。
        currentLiked.forEach((current) => {
            if(current === liked.new) {
                isOverlapped = true;
            }else {
                //無いと追加
                uploadData.append("liked", String(current));
            }
        });

        
        if(!isOverlapped){
            //liked.newは新しいid, 
            uploadData.append("liked", String(liked.new));
        // いいねが1県から0県になるとき、patchではできないため、putで行う。
        }else if(currentLiked.length === 1) {
            uploadData.append("title", liked.title);
            const res = await axios.put(`${apiUrlPost}${liked.id}/`, uploadData, {
                headers: {
                    headers : {"Content-Type": "application/json"},
                    //localStorageの内容をとる。ログインが成功し、後処理でトークンを格納するため、ここで使用できる。
                    Authorization: `JWT ${localStorage.localJWT}`, 
                    },
                })
            return res.data;
        }

        // 複数県のいいねが一件減る場合、patch処理でOK
        const res = await axios.patch(`${apiUrlPost}${liked.id}/`, uploadData, {
            headers: {
                headers : {"Content-Type": "application/json"},
                //localStorageの内容をとる。ログインが成功し、後処理でトークンを格納するため、ここで使用できる。
                Authorization: `JWT ${localStorage.localJWT}`, 
            },
        });
    return res.data;
    });

//commentを取得する
export const fetchAsyncGetComments = createAsyncThunk(
    "comment/get",
    async () => {
        const res = await axios.get(apiUrlComment, {
            headers: {
                Authorization: `JWT ${localStorage.localJWT}`, 
            },
        });
        return res.data;
    },

);

//commentを投稿する。
export const fetchAsyncPostComment = createAsyncThunk(
    "comment/post",
    async (comment: PROPS_COMMENT) => {
        const res = await axios.post(apiUrlComment, comment, {
            headers: {
                Authorization: `JWT ${localStorage.localJWT}`, 
            },
        });
        return res.data;
    }
)

export const postSlice = createSlice({
  name: 'post',
  initialState:{
      isLoadingPost: false,
      openNewPost: false,
      posts: [
          {
              id: 0,
              title: "",
              userPost: 0,
              created_on: "",
              img: "",
              liked: [0],
          },
      ],
      comments: [
          {
            id:0,
            text:"",
            usercomment:0,
            post: 0,
          }

      ]
  },
  // The `reducers` field lets us define reducers and generate associated actions
  reducers: {

    //モーダル表示管理
      fetchPostStart(state) {
          state.isLoadingPost = true;
      },
      fetchPostEnd(state) {
          state.isLoadingPost = false;
      },
      setOpenNewPost(state) {
          state.openNewPost = true;
      },
      resetOpenNewPost(state) {
          state.openNewPost = false;
      },
  },

  // 非同期関数の後処理、login関数。
  // fullfilled:正常終了の後処理
  extraReducers:(builder) => {

    //正常終了したときに、payloadに保存する。
    builder.addCase(fetchAsyncGetPosts.fulfilled, (state, action) => {
        return {
            ...state,
            posts: action.payload,
        };
    });
    builder.addCase(fetchAsyncNewPost.fulfilled, (state, action) => {
        return {
            ...state,
            //spreadで展開して、最後に作った要素に新しい要素を足している
            posts: [...state.posts, action.payload]
        }
    })

    builder.addCase(fetchAsyncGetComments.fulfilled, (state, action) => {
        return {
            ...state,
            posts:action.payload
        }
    })
    builder.addCase(fetchAsyncPostComment.fulfilled, (state, action)=> {
        return {
            ...state,
            //spreadで展開して、最後に作った要素に新しい要素を足している
            comments: [...state.posts, action.payload]
        }
    })
    builder.addCase(fetchAsyncPatchLiked.fulfilled, (state, action) => {
        return {
            ...state,
            //既存の投稿一覧を展開し、更新した要素に一致する要素を置き換える。
            posts: state.posts.map((post) => 
            post.id === action.payload.id ? action.payload : post)
        }
    })
}})
    

//reducer内で定義したactionに変更する。
export const { 
    fetchPostStart,
    fetchPostEnd,
    setOpenNewPost,
    resetOpenNewPost
} = postSlice.actions;

//selecterで使用できる様にexportする。
export const selectIsLoadingPost = (state: RootState) => 
state.post.isLoadingPost

export const selectOpenNewPost = (state: RootState) => state.post.openNewPost;
export const selectPosts = (state: RootState) => state.post.posts;
export const selectComments = (state: RootState) => state.post.comments;

export default postSlice.reducer;
