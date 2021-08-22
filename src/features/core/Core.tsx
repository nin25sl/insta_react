//作成。コンポーネントの集約

//reacthooksのuseeffectを使用
import React, {useEffect}from "react"
import Auth from "../auth/Auth"

import styles from "./Core.module.css"

//storeにアクセスするために使用
import { useSelector, useDispatch} from "react-redux"
import { AppDispatch, appDispatch } from "../../app/store"

import { withStyles } from "@material-ui/core/styles"
import {
    Button,
    Grid,
    Avatar,
    Badge,
    CircularProgress,
} from "@material-ui/core"

//カメラマーク
import {MdAddAPhoto} from "react-icons/md"

import {
    editNickname,
    selectProfile,
    selectIsLoadingAuth,
    setOpenSignIn,
    resetOpenSignIn,
    setOpenSignUp,
    resetOpenSignUp,
    setOpenProfile,
    resetOpenProfile,
    fetchAsyncGetMyProf,
    fetchAsyncGetProfs,
    selectOpenSignUp
} from "../auth/authSlice"

import {
    selectPosts,
    selectIsLoadingPost,
    setOpenNewPost,
    resetOpenNewPost,
    fetchAsyncGetPosts,
    fetchAsyncGetComments,
} from "../post/postSlice"
import { divide } from "lodash"

import Post from "../post/Post"

//ログイン時に右下の緑色がONになる
const StyledBadge = withStyles((theme) => ({
    badge: {
      backgroundColor: '#44b700',
      color: '#44b700',
      boxShadow: `0 0 0 2px ${theme.palette.background.paper}`,
      '&::after': {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        borderRadius: '50%',
        animation: '$ripple 1.2s infinite ease-in-out',
        border: '1px solid currentColor',
        content: '""',
      },
    },
    '@keyframes ripple': {
      '0%': {
        transform: 'scale(.8)',
        opacity: 1,
      },
      '100%': {
        transform: 'scale(2.4)',
        opacity: 0,
      },
    },
  }))(Badge);
  

const Core: React.FC = () => {

    //dispatchの実態の定義、
    const dispatch: AppDispatch = useDispatch();

    //stateをreduxstoreの中から呼び出せる様する。
    //loginしているユーザ情報をstoreから呼び出す。
    const profile = useSelector(selectProfile)
    const posts = useSelector(selectPosts)
    const isLoadungPost = useSelector(selectIsLoadingPost)
    const isLoadingAuth = useSelector(selectIsLoadingAuth)

    //useEffect => ブラウザの初期起動時に実行される
    useEffect(() => {
        const fetchBootLoader = async () => {
            // localJWTトークンうむ確認
            if (localStorage.localJWT) {
                // localJWTトークンがある場合、サインイン不要のためモーダルを閉じる
                dispatch(resetOpenSignIn());
                // ログインしているユーザ情報を取得
                const result = await dispatch(fetchAsyncGetMyProf());
                // JWTトークンが切れている場合
                if(fetchAsyncGetProfs.rejected.match(result)) {
                    // サインインモーダルを取得する。
                    dispatch(setOpenSignIn());
                    return null
                }
                //投稿一覧、プロフィール一覧、コメント一覧を取得
                await dispatch(fetchAsyncGetPosts());
                await dispatch(fetchAsyncGetProfs());
                await dispatch(fetchAsyncGetComments());
    
            }
        };
        fetchBootLoader();
    }, [dispatch])


    return <div>
        <Auth />
        <div className={styles.core_header}>
            <h1 className={styles.core_title}>SNS clone</h1>
            {/* ログインしている状態とログイン前の状態の画面を切り替える処理 */}
            {/* ログイン後はカメラ、アバター、ログアウト画面を作成する。 */}

            {/* myprofileのnicknameが存在するとき、左のフラグメントを実行、しなければdivタグを実行 */}
            {profile?.nickName ? <>
            <button 
            className={styles.core_btnModal}
            onClick={() => {
                //カメラボタンが押されたとき、新規投稿のモーダルを表示
                dispatch(setOpenNewPost());
                // profileを閉じる
                dispatch(resetOpenProfile())
            }}
            >
                {/* カメラボタンの表示 */}
                <MdAddAPhoto />
            </button>
            {/* ログアウトしたときの処理 */}
            <div className={styles.core_logout}>
                {/* 投稿関係か認証関係のローディングがTrueの場合、遠景乗の読み込みを表示 */}
                {(isLoadungPost || isLoadingAuth) && <CircularProgress />}
                <Button
                onClick={() => {
                    localStorage.removeItem("localJWT");
                    dispatch(editNickname(""));
                    dispatch(resetOpenProfile());
                    dispatch(resetOpenNewPost());
                    dispatch(setOpenSignIn());
                }}
                > Logout </Button>
                {/* buttonがクリックされたとき、プロフィールが編集できる。また、投稿画面の場合は閉じる */}
                <button 
                className={styles.core_btnModal}
                onClick={() => {
                    dispatch(setOpenProfile())
                    dispatch(resetOpenNewPost())
                }}
                >
                    {/* material-uiのコピペ */}
                    <StyledBadge
                        overlap="circular"
                        anchorOrigin={{
                        vertical: 'bottom',
                        horizontal: 'right',
                        }}
                        variant="dot"
                    >
                        {/* 画像の表示 */}
                        <Avatar alt="who?" src={profile.img} />{" "}
                    </StyledBadge>
                </button>
            </div>
            </> :
            // logout画面時のsigninとsignupの表示 
            <div>
                <Button
                onClick={() => {
                    dispatch(setOpenSignIn());
                    dispatch(resetOpenSignUp());
                }}
                > LogIn</Button>
                <Button
                onClick={() => {
                    dispatch(setOpenSignUp());
                    dispatch(resetOpenSignIn());
                }}
                >SignUp
                </Button>
                </div>
            }
        </div>

        {/* 投稿一覧の表示 */}
        {profile?.nickName && <>
        <div className={styles.core_posts}>
            <Grid container spacing={4}>
                {posts
                .slice(0)
                // 最新のものが最初
                .reverse()
                // mapで中身を取り出している。
                .map((post) => (
                    // 横全体が12, 960pxより大きいとき、3列になる（md={4}）
                    <Grid key={post.id} item xs={12} md={4}>
                        <Post
                        postId={post.id}
                        title={post.title}
                        loginId={profile.userProfile}
                        userPost={post.userPost}
                        imageUrl={post.img}
                        liked={post.liked}
                        />
                    </Grid>
                ))
                }
            </Grid>
        </div>
        </>}
    </div>
}

export default Core;
