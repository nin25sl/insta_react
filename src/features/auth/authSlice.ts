//基本はCOunterSlice.tsの中身を変更する形となる。
import { createSlice,createAsyncThunk} from '@reduxjs/toolkit';
import { RootState, } from '../../app/store';
import axios from "axios";
import {PROPS_AUTHEN, PROPS_PROFILE, PROPS_NICKNAME} from "../types";

const apiUrl = process.env.REACT_APP_DEV_API_URI;

//emailとpasswordをauthen/jwt/createに投げたときに、トークンを受け取る。
//Reduxtoolkit -> 成功：fullfilled, 失敗：rejected, 途中
export const fetchAsyncLogin = createAsyncThunk (
    //actionの名前、好きな名前をつけれる。
    "auth/post",
    //非同期async awaitで同期系へ変換
    //引数authen, PROPS_AUTHENの形を使用
    async (authen: PROPS_AUTHEN) => {
        //postメソッドで行う
        console.log(apiUrl)
        const res = await axios.post(`${apiUrl}authen/jwt/create/`, authen, {
            //postだと、headerが必要
            headers: {
                "Content-Type": "application/json",
            },
        });
        return res.data
    }
);

//emailとpaawordを受け取り、ユーザを作成するAPIへ投げる
export const fetchAsyncRegister = createAsyncThunk(
    "auth/register",
    async (auth: PROPS_AUTHEN) => {
        const res = await axios.post(`${apiUrl}api/register/`, auth, {
            headers:{
                "Content-Type": "application/json",
            },
        });
        return res.data;
    },
);

export const fetchAsyncCreateProf = createAsyncThunk(
    "profile/post",
    async (nickName: PROPS_NICKNAME) => {
        const res = await axios.post(`${apiUrl}api/profile/`, nickName, {
            headers: {
                "Content-Type": "application/json",
                //localStorageの内容をとる。ログインが成功し、後処理でトークンを格納するため、ここで使用できる。
                Authorization: `JWT ${localStorage.localJWT}`, 
            },
        });

        return res.data;
    },
);

export const fetchAsyncUpdateProf = createAsyncThunk(
    "profile/put",
    async (profile: PROPS_PROFILE) => {
        //FormDataとは？
        const uploadData = new FormData();
        uploadData.append("nickName", profile.nickName)
        profile.img && uploadData.append("img", profile.img, profile.img.name);
        const res = await axios.put(
            `${apiUrl}api/profile/${profile.id}/`,
            uploadData,
            {
                headers: {
                    "Content-Type": "application/json",
                    //localStorageの内容をとる。ログインが成功し、後処理でトークンを格納するため、ここで使用できる。
                    Authorization: `JWT ${localStorage.localJWT}`, 
                },
            }
        );
        return res.data
    },
);

export const fetchAsyncGetMyProf = createAsyncThunk("profile/get", async() => {
    const res = await axios.get(`${apiUrl}api/myprofile/`,{
        headers: {
            Authorization: `JWT ${localStorage.localJWT}`, 
        },
    });
    //djangoのmyProfileListViewでオブジェクトを返すと、一つでもlistで取れるため、配列を指定して返している。
    return res.data[0];
})

export const fetchAsyncGetProfs = createAsyncThunk("profiles/get", async() => {
    const res = await axios.get(`${apiUrl}api/profile/`,{
        headers: {
            Authorization: `JWT ${localStorage.localJWT}`, 
        },
    });
    return res.data;
});

export const authSlice = createSlice({
  name: 'auth',
  initialState:{
    //   signinのモーダルを開く
      openSignIn: true,
      // ユーザ作成のモーダル
      openSignUp: false,
      // プロフィールを開くときのモーダル
      openProfile: false,
      isLoadingAuth: false,
      //ログインしているユーザをreduxで管理する
      myprofile: {
          id: 0,
          nickName: "",
          userProfile: 0,
          created_on: "",
          img: "",
      },
      //存在するプロフィールの一蘭をgetするため、reduxで管理している。djangoのprofileモデルで定義
      profiles:[
          {
              id: 0,
              nickName:"",
              userProfile: 0,
              created_on: "",
              img: "",
          },
      ],
  },
  // The `reducers` field lets us define reducers and generate associated actions
  reducers: {
    fetchCredStart(state) {
        state.isLoadingAuth = true;
      },
      fetchCredEnd(state) {
        state.isLoadingAuth = false;
      },
      setOpenSignIn(state) {
        state.openSignIn = true;
      },
      resetOpenSignIn(state) {
        state.openSignIn = false;
      },
      setOpenSignUp(state) {
        state.openSignUp = true;
      },
      resetOpenSignUp(state) {
        state.openSignUp = false;
      },
      setOpenProfile(state) {
        state.openProfile = true;
      },
      resetOpenProfile(state) {
        state.openProfile = false;
      },
      editNickname(state, action) {
        state.myprofile.nickName = action.payload;
      },
  },

  // 非同期関数の後処理、login関数。
  // fullfilled:正常終了の後処理
  extraReducers:(builder) => {
        //取得したJWTのトークンをlocalStorageにセットする。
    builder.addCase(fetchAsyncLogin.fulfilled,(state, action) => {
        //非同期関数のデータの受け取りは、action.payloadで取得可能。JWTはreflashとaccessが取れるため、accessを格納する。
        localStorage.setItem("localJWT", action.payload.access);
    });

      //profileをfetchAsyncCreateProfの返り値で受け取るので、initialstateのmyprofileに保存する。
    builder.addCase(fetchAsyncCreateProf.fulfilled,(state, action) => {
        state.myprofile = action.payload;
    });

      //loginしているユーザのprofileを取得する。
    builder.addCase(fetchAsyncGetMyProf.fulfilled, (state, action) => {
        state.myprofile = action.payload;
    });
    //存在するプロフィールの前一覧を取得する。initialstateのprofilesに保存する。
    builder.addCase(fetchAsyncGetProfs.fulfilled, (state, action) => {
        state.profiles = action.payload;
    });
    //プロフィールの更新結果をstateへ保存する。
    builder.addCase(fetchAsyncUpdateProf.fulfilled, (state, action) => {
        state.myprofile = action.payload;
        //SPAを実現するために必要、更新したプロフィールの情報を即座にアップデートする。更新したデータに一致するデータを更新後のデータに置き換える。
        state.profiles = state.profiles.map((prof) => 
        prof.id === action.payload.id ? action.payload : prof
        );
    });
  },
});

//reducer内で定義したactionに変更する。
export const { fetchCredStart, fetchCredEnd, setOpenSignIn, resetOpenSignIn, setOpenSignUp, resetOpenSignUp, setOpenProfile, resetOpenProfile, editNickname } = authSlice.actions;

//useSelecterの設定、コンポーネントからstoreの中身を覗くことができる
export const selectIsLoadingAuth = (state: RootState) =>
//auth(store内)のisLoadingAuthを返す.
    state.auth.isLoadingAuth
export const selectOpenSignIn = (state: RootState) => state.auth.openSignIn;
export const selectOpenSignUp = (state: RootState) => state.auth.openSignUp;
export const selectOpenProfile = (state: RootState) => state.auth.openProfile;
export const selectProfile = (state: RootState) => state.auth.myprofile;
export const selectProfiles = (state: RootState) => state.auth.profiles;

export default authSlice.reducer;
