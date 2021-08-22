//Reactのファンクショナルコンポーネント使用⇨rafce

import React,{useState} from 'react'
import styles from "./Post.module.css"
import {makeStyles} from "@material-ui/core/styles"
import {Avatar, Divider, Checkbox} from "@material-ui/core"
import {Favorite, FavoriteBorder} from "@material-ui/icons"

import AvatarGroup from "@material-ui/lab/AvatarGroup"

import {useSelector, useDispatch} from "react-redux"
import {AppDispatch, appDispatch} from "../../app/store"

// authStoreの中のprofileステイトを参照できる様になる
import {selectProfiles} from "../auth/authSlice"

import {
    selectComments,
    fetchPostStart,
    fetchPostEnd,
    fetchAsyncPostComment,
    fetchAsyncPatchLiked
} from "./postSlice"

import {PROPS_POST} from "../types"

//iconのサイズを変更する場合、material-ui内のsizesの値を変更することで可能(今回はsmallのみ)
const useStyles = makeStyles((theme) => ({
    small: {
      width: theme.spacing(3),
      height: theme.spacing(3),
    },
  }));

//Coreコンポーネント内の<Post>の引数を受け取るため、PROPSに定義する必要あり

const Post: React.FC<PROPS_POST> = ({
    postId,
    loginId,
    userPost,
    title,
    imageUrl,
    liked,
}) => {
    console.log(postId,loginId,title)
    //アバターを小さくする結果の格納
    const classes = useStyles()
    // dispatchの実態
const dispatch: AppDispatch = useDispatch();
const profiles = useSelector(selectProfiles);
const comments = useSelector(selectComments);
// text属性の定義
const [text, setText] = useState("");

// commentsは全て取得するため、postIDにあうコメントのみフィルターをかけ取得する。
const commentsOnPost = comments.filter((com) => {
    return com.post === postId
})

//前プロフィールから、投稿者のプロフィールを取得
const prof = profiles.filter((prof) => {
    return prof.userProfile === userPost
})


const postComment = async (e:React.MouseEvent<HTMLElement>) => {
    //無駄なリフレッシュを無効化
    e.preventDefault()
    //ユーザが入力したテキストとIDを取得
    const packet = {text:text, post: postId};
    await dispatch(fetchPostStart());
    await dispatch(fetchAsyncPostComment(packet))
    await dispatch(fetchPostEnd());
    setText("")
}

//いいねボタンの実装
const handlerLiked = async () => {
    const packet = {
        id: postId,
        title: title,
        current: liked,
        new: loginId
    };
    await dispatch(fetchPostStart());
    await dispatch(fetchAsyncPatchLiked(packet));
    await dispatch(fetchPostEnd());
}
//投稿がある時のみ、投稿を表示する。
console.log(title)
if (title)
console.log("中には入ってる")
    return (
        <div className={styles.post}>
            <div className={styles.post_header}>
                {/* filterで取得した投稿情報がprofに入るため、画像とにっくねーむを表示する。 */}
                <Avatar className={styles.post_avatar} src={prof[0]?.img} />
                <h3>{prof[0]?.nickName}</h3>
            </div>

            {/* 投稿画像は引数で取得するため、そのまま割り当てる */}
            <img className={styles.post_image} src={imageUrl} alt="" />

            <h4 className={styles.post_text}>
                {/*material-ui参考 */}
            <Checkbox
                className={styles.post_checkBox}
                icon={<FavoriteBorder />}
                checkedIcon={<Favorite />}
                // checkedはtrue:falseで管理
                // likedにいいねの配列型で入るため、自分のIDがリストにあるかどうか確認している。
                checked={liked.some((like) => like === loginId)}
                onChange={handlerLiked}
             />
                <strong>{prof[0]?.nickName}</strong> {title}
                <AvatarGroup max={7}>
                    {liked.map((like) => (
                        //いいねしたアバター画像の表示
                        <Avatar
                        className={styles.post_avatarGroup}
                        key={like}
                        src={profiles.find((prof) => prof.userProfile === like)?.img}
                        />
                    ))}
                </AvatarGroup>
            </h4>
            {/* こめんと一覧の表示 */}
            <Divider />
            <div className={styles.post_comment}>
            {commentsOnPost.map((comment) => (
                <div key={comment.id} className={styles.post_comment}>
                    <Avatar
                    src={
                        profiles.find(
                            (prof) => prof.userProfile === comment.usercomment
                        )?.nickName
                    }
                    className={classes.small}
                    />
                    <p>
                        <strong className={styles.post_strong}>
                            {
                                profiles.find(
                                    (prof) => prof.userProfile === comment.usercomment
                                )?.nickName
                            }
                        </strong>
                        {comment.text}
                    </p>
                </div>
            ))}
        </div>
        {/* コメント投稿　入力をかきかえるたびに、valueを変更している。 */}
        <form className={styles.post_commentBox}>
            <input 
            className={styles.post_input}
            type="text"
            placeholder="add a comment"
            value={text}
            onChange={(e) => setText(e.target.value)}
            />
            {/* valueがないと、投稿できない。 */}
            <button
            disabled={!text.length}
            className={styles.post_button}
            type="submit"
            onClick={postComment}
            >
                Post
            </button>
        </form>
    </div>
    );
//titleが無いと、nullを返す
return null;
}

export default Post

